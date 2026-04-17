import {useEffect, useRef, forwardRef, useImperativeHandle} from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? '';
const DELIVERY_LOCATION: [number, number] = [-75.696761, 45.418973];

// Custom "TYP map colors" palette — applied to Standard style when lightPreset=day, theme=default
const TYP_DAY_COLORS: Record<string, string> = {
  colorLand:       'hsl(20, 8%, 96%)',
  colorWater:      'hsl(188, 57%, 79%)',
  colorRoads:      'hsl(185, 25%, 80%)',
  colorTrunks:     'hsl(191, 20%, 70%)',
  colorMotorways:  'hsl(179, 23%, 70%)',
  colorGreenspace: 'hsl(99, 45%, 81%)',
  colorBuildings:  'hsl(44, 6%, 96%)',
};

const applyTypDayColors = (map: mapboxgl.Map) => {
  try {
    for (const [key, value] of Object.entries(TYP_DAY_COLORS)) {
      map.setConfigProperty('basemap', key, value);
    }
  } catch {}
};

mapboxgl.accessToken = MAPBOX_TOKEN;

interface MapViewProps {
  reduceMotion: boolean;
  fasterCamera: boolean;
  mapStyle: string;
  onReady: () => void;
  cameraOffset?: [number, number];
  center?: [number, number];
}

export interface MapViewRef {
  reset: () => void;
}

const MapView = forwardRef<MapViewRef, MapViewProps>(
  ({reduceMotion, fasterCamera, mapStyle, onReady, cameraOffset = [0, -30], center}, ref) => {
    const effectiveCenter: [number, number] = center ?? DELIVERY_LOCATION;
    // Always-current ref so async callbacks (style.load, setTimeout, idle) never use a stale center
    const centerRef = useRef<[number, number]>(effectiveCenter);
    centerRef.current = effectiveCenter;
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<mapboxgl.Map | null>(null);

    const hasAnimated = useRef(false);
    const readyFired = useRef(false);
    // Track the currently loaded style URL to avoid redundant setStyle calls
    const loadedStyleUrl = useRef<string>('');

    // Parse style parameter - format: "preset" or "preset|theme" or "preset|theme|flat" or full URL
    // "amplified|*" uses streets-v12 with a zoomed-out tilted start + 3D buildings
    const getStyleConfig = () => {
      let lightPreset = 'day';
      let theme = 'default';
      let finalMapStyle = 'mapbox://styles/mapbox/standard';
      let isStandardStyle = true;
      let flatMode = false;
      let isAmplified = false;

      if (mapStyle.startsWith('amplified')) {
        const ampTheme = mapStyle.split('|')[1] || 'day';
        finalMapStyle = ampTheme === 'night'
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/streets-v12';
        isStandardStyle = false;
        isAmplified = true;
      } else if (mapStyle.startsWith('mapbox://')) {
        const pipeIdx = mapStyle.indexOf('|');
        if (pipeIdx !== -1) {
          finalMapStyle = mapStyle.slice(0, pipeIdx);
          const rest = mapStyle.slice(pipeIdx + 1).split('|');
          lightPreset = rest[0] || 'day';
          theme = rest[1] || 'default';
          isStandardStyle = true;
        } else {
          finalMapStyle = mapStyle;
          isStandardStyle = mapStyle.includes('/standard');
        }
      } else {
        const parts = mapStyle.split('|');
        lightPreset = parts[0] || 'day';
        theme = parts[1] || 'default';
        flatMode = parts[2] === 'flat';
      }

      return {lightPreset, theme, finalMapStyle, isStandardStyle, flatMode, isAmplified};
    };

    const {finalMapStyle} = getStyleConfig();

    const AMPLIFIED_LAYER_ID = 'amplified-3d-buildings';

    const enableClassic3dBuildings = (map: mapboxgl.Map, extrusionColor = '#ccc8c0') => {
      try {
        // Show existing extrusion layers if any
        const layers = (map.getStyle()?.layers || []) as any[];
        let hasExtrusion = false;
        for (const layer of layers) {
          if (layer.type === 'fill-extrusion') {
            try { map.setLayoutProperty(layer.id, 'visibility', 'visible'); hasExtrusion = true; } catch {}
          }
        }
        // streets-v12 / dark-v11 have no extrusion layers by default — add one
        if (!hasExtrusion && !map.getLayer(AMPLIFIED_LAYER_ID)) {
          map.addLayer({
            id: AMPLIFIED_LAYER_ID,
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 11,
            paint: {
              'fill-extrusion-color': extrusionColor,
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': 0.9,
              'fill-extrusion-opacity-transition': { duration: 400, delay: 0 },
            },
          } as any);
        } else if (!hasExtrusion) {
          try { map.setLayoutProperty(AMPLIFIED_LAYER_ID, 'visibility', 'visible'); } catch {}
        }
      } catch {}
    };

    const disableClassic3dBuildings = (map: mapboxgl.Map) => {
      try { map.setLayoutProperty(AMPLIFIED_LAYER_ID, 'visibility', 'none'); } catch {}
    };

    const resetExtrusionOpacity = (map: mapboxgl.Map) => {
      try {
        // Instant snap to full opacity — no bleed-through from a previous fade
        map.setPaintProperty(AMPLIFIED_LAYER_ID, 'fill-extrusion-opacity-transition', { duration: 0, delay: 0 });
        map.setPaintProperty(AMPLIFIED_LAYER_ID, 'fill-extrusion-opacity', 0.9);
      } catch {}
    };

    const setLabelOpacity = (map: mapboxgl.Map, opacity: number, transitionMs: number) => {
      try {
        const layers = (map.getStyle()?.layers || []) as any[];
        for (const layer of layers) {
          if (layer.type !== 'symbol') continue;
          try {
            map.setPaintProperty(layer.id, 'text-opacity-transition', { duration: transitionMs, delay: 0 });
            map.setPaintProperty(layer.id, 'text-opacity', opacity);
            map.setPaintProperty(layer.id, 'icon-opacity-transition', { duration: transitionMs, delay: 0 });
            map.setPaintProperty(layer.id, 'icon-opacity', opacity);
          } catch {}
        }
      } catch {}
    };

    const scheduleLabelFade = (map: mapboxgl.Map, animDuration: number, fadeInAfter = false) => {
      // Fade labels out quickly at start — no label churn visible during camera move
      setLabelOpacity(map, 0, 150);
      if (fadeInAfter) {
        // For zoom-in: wait until animation is fully done before showing labels
        setTimeout(() => setLabelOpacity(map, 1, 300), animDuration + 50);
      } else {
        // Fade back in during the last 70% with a long transition — labels emerge as camera settles
        setTimeout(
          () => setLabelOpacity(map, 1, Math.round(animDuration * 0.5)),
          Math.round(animDuration * 0.3)
        );
      }
    };

    // Fade buildings out during the animation. startFraction controls when the fade begins
    // (0.08 = early, for zoom-out; 0.65 = late, for zoom-in so buildings are visible while approaching).
    const scheduleExtrusionFade = (map: mapboxgl.Map, animDuration: number, startFraction = 0.08) => {
      setTimeout(() => {
        try {
          map.setPaintProperty(AMPLIFIED_LAYER_ID, 'fill-extrusion-opacity-transition', { duration: 400, delay: 0 });
          map.setPaintProperty(AMPLIFIED_LAYER_ID, 'fill-extrusion-opacity', 0);
        } catch {}
      }, Math.round(animDuration * startFraction));
    };

    const hidePoiLabels = (map: mapboxgl.Map) => {
      try {
        const layers = (map.getStyle()?.layers || []) as any[];
        for (const layer of layers) {
          if (layer.type !== 'symbol') continue;
          const id = String(layer.id || '');
          if (/poi|place.of.interest|shop|commerce|business|amenity/i.test(id)) {
            try { map.setLayoutProperty(id, 'visibility', 'none'); } catch {}
          }
        }
      } catch {}
    };

    const hideHighwayNumbers = (map: mapboxgl.Map) => {
      try {
        const layers = (map.getStyle()?.layers || []) as any[];
        for (const layer of layers) {
          if (layer.type !== 'symbol') continue;
          const id = String(layer.id || '');
          if (/shield|road-number|route-shield|motorway-number|trunk-number|primary-number/i.test(id)) {
            try {
              map.setLayoutProperty(id, 'visibility', 'none');
            } catch {}
            continue;
          }
          let icon = null,
            text = null;
          try {
            icon = map.getLayoutProperty(layer.id, 'icon-image');
          } catch {}
          try {
            text = map.getLayoutProperty(layer.id, 'text-field');
          } catch {}
          const iconStr = JSON.stringify(icon || '');
          const textStr = JSON.stringify(text || '');
          const mentionsShield = /shield|road.*number|motorway.*number|highway.*shield|route.*shield/i.test(iconStr);
          const mentionsRef = /"ref"|\{ref\}/i.test(textStr);
          if (mentionsShield || mentionsRef) {
            try {
              map.setLayoutProperty(layer.id, 'visibility', 'none');
            } catch {}
          }
        }
      } catch {}
    };

const startAnimation = (map: mapboxgl.Map) => {
      const mapEl = document.getElementById('map');
      if (mapEl) mapEl.classList.add('fade-in');

      const isCustomStd = mapStyle.startsWith('mapbox://') && mapStyle.includes('|');
      const isClassicOrAmplified = (mapStyle.startsWith('mapbox://') && !mapStyle.includes('/standard') && !isCustomStd) || mapStyle.startsWith('amplified');
      const isAmplifiedAnim = mapStyle.startsWith('amplified');
      const isZoomIn = mapStyle.includes('zoomin');
      const targetPitch = isAmplifiedAnim ? 35 : (isClassicOrAmplified ? 0 : 65);

      if (reduceMotion) {
        map.jumpTo({center: centerRef.current, pitch: targetPitch, zoom: isClassicOrAmplified ? 14.75 : 16, bearing: 12, offset: cameraOffset} as any);
      } else {
        const cameraDuration = fasterCamera ? 750 : 1500;
        if (isAmplifiedAnim) {
          resetExtrusionOpacity(map);
          scheduleExtrusionFade(map, cameraDuration, isZoomIn ? 0.65 : 0.08);
          if (isZoomIn) {
            setLabelOpacity(map, 0, 0);
            setTimeout(() => setLabelOpacity(map, 1, 400), cameraDuration + 200);
          } else {
            scheduleLabelFade(map, cameraDuration);
          }
        }
        map.easeTo({
          center: centerRef.current,
          pitch: targetPitch,
          zoom: isZoomIn ? 16 : isClassicOrAmplified ? 14.75 : 16,
          bearing: 12,
          offset: cameraOffset,
          duration: cameraDuration,
          easing: (t: number) => 1 - Math.pow(1 - t, 3),
        } as any);
      }
    };

    useEffect(() => {
      if (!mapContainer.current) return;

      const isClassicInit = mapStyle.startsWith('mapbox://') && !mapStyle.includes('/standard');
      const isAmplifiedInit = mapStyle.startsWith('amplified');
      const isZoomInInit = mapStyle.includes('zoomin');
      loadedStyleUrl.current = finalMapStyle;

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        center: effectiveCenter,
        zoom: isZoomInInit    ? (reduceMotion ? 14.75 : 15.5)
            : isAmplifiedInit ? (reduceMotion ? 14.75 : 15.5)
            : isClassicInit   ? (reduceMotion ? 14.75 : 14.25)
            : (reduceMotion ? 16 : 14.25),
        pitch: isZoomInInit    ? (reduceMotion ? 0 : 72)
             : isAmplifiedInit ? (reduceMotion ? 0 : 60)
             : isClassicInit   ? 0
             : (reduceMotion ? 65 : 22.5),
        bearing: reduceMotion ? 12 : (isZoomInInit ? 32 : 6),
        style: finalMapStyle,
        antialias: true,
        attributionControl: false,
        fadeDuration: 0,
        refreshExpiredTiles: false,
        preserveDrawingBuffer: false,
        trackResize: false,
        renderWorldCopies: false,
        maxTileCacheSize: 50,
        interactive: false,
        dragPan: false,
        dragRotate: false,
        scrollZoom: false,
        boxZoom: false,
        doubleClickZoom: false,
        touchZoomRotate: false,
        touchPitch: false,
        keyboard: false,
      } as any);

      map.on('style.load', () => {
        // Use loadedStyleUrl ref (always current) to decide what to apply —
        // avoids stale-closure issues since this handler lives inside useEffect([], []).
        const url = loadedStyleUrl.current;
        if (url === 'mapbox://styles/mapbox/streets-v12') {
          enableClassic3dBuildings(map, '#ccc8c0');
        } else if (url === 'mapbox://styles/mapbox/dark-v11') {
          enableClassic3dBuildings(map, '#4a4a52');
        } else if (url === 'mapbox://styles/mapbox/standard') {
          // Apply Standard style config on initial mount — the mapStyle update effect
          // skips the first run, so we must handle it here.
          try {
            const parts = mapStyle.split('|');
            const preset = parts[0] || 'day';
            const themeVal = parts[1] || 'default';
            const flat = parts[2] === 'flat';
            map.setConfigProperty('basemap', 'lightPreset', preset);
            map.setConfigProperty('basemap', 'theme', themeVal);
            map.setConfigProperty('basemap', 'showPointOfInterestLabels', false);
            map.setConfigProperty('basemap', 'showTransitLabels', false);
            map.setConfigProperty('basemap', 'showRoadLabels', flat);
            map.setConfigProperty('basemap', 'show3dObjects', !flat);
            map.setConfigProperty('basemap', 'show3dBuildings', !flat);
            if (preset === 'day' && themeVal === 'default') applyTypDayColors(map);
          } catch {}
        } else {
          // Custom Standard URL (pipe format): getStyleConfig() reads from the initial mapStyle closure
          const cfg = getStyleConfig();
          if (cfg.isStandardStyle && url === cfg.finalMapStyle) {
            try {
              map.setConfigProperty('basemap', 'lightPreset', cfg.lightPreset);
              map.setConfigProperty('basemap', 'theme', cfg.theme);
              map.setConfigProperty('basemap', 'showPointOfInterestLabels', false);
              map.setConfigProperty('basemap', 'showTransitLabels', false);
              map.setConfigProperty('basemap', 'showRoadLabels', false);
              map.setConfigProperty('basemap', 'show3dObjects', true);
              map.setConfigProperty('basemap', 'show3dBuildings', true);
            } catch {}
          }
        }
        hideHighwayNumbers(map);
        hidePoiLabels(map);
        map.on('styledata', () => { hideHighwayNumbers(map); hidePoiLabels(map); });
      });

      map.on('load', () => {
        map.resize();

        const fireReady = () => {
          if (readyFired.current) return;
          readyFired.current = true;
          onReady();
          startAnimation(map);
        };

        map.once('idle', () => {
          setTimeout(fireReady, 100);
        });

        setTimeout(fireReady, reduceMotion ? 400 : 1200);
      });

      mapInstance.current = map;

      return () => {
        map.remove();
      };
    }, []); // Only mount once

    // Update map style when mapStyle prop changes (skip initial mount — handled by useEffect([], []))
    const styleEffectMounted = useRef(false);
    useEffect(() => {
      if (!styleEffectMounted.current) { styleEffectMounted.current = true; return; }
      if (!mapInstance.current) return;

      const map = mapInstance.current;

      // Parse the new style
      let lightPreset = 'day';
      let theme = 'default';
      let flatMode = false;
      let isAmplified = false;
      let targetStyleUrl = 'mapbox://styles/mapbox/standard';

      if (mapStyle.startsWith('amplified')) {
        isAmplified = true;
        const ampTheme = mapStyle.split('|')[1] || 'day';
        targetStyleUrl = ampTheme === 'night'
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/streets-v12';
      } else if (mapStyle.startsWith('mapbox://')) {
        const pipeIdx = mapStyle.indexOf('|');
        if (pipeIdx !== -1) {
          targetStyleUrl = mapStyle.slice(0, pipeIdx);
          const rest = mapStyle.slice(pipeIdx + 1).split('|');
          lightPreset = rest[0] || 'day';
          theme = rest[1] || 'default';
        } else {
          targetStyleUrl = mapStyle;
        }
      } else {
        const parts = mapStyle.split('|');
        lightPreset = parts[0] || 'day';
        theme = parts[1] || 'default';
        flatMode = parts[2] === 'flat';
      }

      const mapEl = mapContainer.current;
      const fadeIn = () => {
        if (mapEl) { mapEl.style.transition = 'opacity 300ms ease'; mapEl.style.opacity = '1'; }
      };

      const styleAlreadyLoaded = loadedStyleUrl.current === targetStyleUrl;

      if (!mapStyle.startsWith('mapbox://') && !isAmplified) {
        // Standard preset — swap back to Standard style, then apply preset + tilt
        loadedStyleUrl.current = 'mapbox://styles/mapbox/standard';
        if (mapEl) { mapEl.style.transition = 'opacity 150ms ease'; mapEl.style.opacity = '0'; }
        map.setStyle('mapbox://styles/mapbox/standard');
        map.once('style.load', () => {
          try {
            map.setConfigProperty('basemap', 'lightPreset', lightPreset);
            map.setConfigProperty('basemap', 'theme', theme);
            map.setConfigProperty('basemap', 'showPointOfInterestLabels', false);
            map.setConfigProperty('basemap', 'showTransitLabels', false);
            map.setConfigProperty('basemap', 'showRoadLabels', flatMode);
            map.setConfigProperty('basemap', 'show3dObjects', !flatMode);
            map.setConfigProperty('basemap', 'show3dBuildings', !flatMode);
            if (lightPreset === 'day' && theme === 'default') applyTypDayColors(map);
          } catch (e) {
            console.error('[Map] Error updating preset:', e);
          }
          map.easeTo({ pitch: 65, duration: 600 });
          fadeIn();
        });
      } else if (isAmplified) {
        // Amplified: enable 3D buildings and play the tilted intro animation
        const isZoomInNow = mapStyle.includes('zoomin');
        const playAmplified = () => {
          hidePoiLabels(map);
          const ampThemeNow = mapStyle.split('|')[1] || 'day';
          const extrusionColor = ampThemeNow === 'night' ? '#4a4a52' : '#ccc8c0';
          enableClassic3dBuildings(map, extrusionColor);
          if (!reduceMotion) {
            map.jumpTo(isZoomInNow
              ? { zoom: 15.5, pitch: 72, bearing: 32, center: centerRef.current }
              : { zoom: 15.5, pitch: 60, bearing: 12, center: centerRef.current } as any);
          }
          resetExtrusionOpacity(map);
          fadeIn();
          setTimeout(() => {
            const dur = fasterCamera ? 750 : 1500;
            scheduleExtrusionFade(map, dur, isZoomInNow ? 0.65 : 0.08);
            if (isZoomInNow) {
              setLabelOpacity(map, 0, 0);
              setTimeout(() => setLabelOpacity(map, 1, 400), dur + 200);
            } else {
              scheduleLabelFade(map, dur);
            }
            map.easeTo({
              center: centerRef.current,
              pitch: 35,
              zoom: isZoomInNow ? 16 : 14.75,
              bearing: 12,
              offset: cameraOffset,
              duration: dur,
              easing: (t: number) => 1 - Math.pow(1 - t, 3),
            } as any);
          }, 200);
        };

        if (mapEl) { mapEl.style.transition = 'opacity 150ms ease'; mapEl.style.opacity = '0'; }

        if (styleAlreadyLoaded) {
          setTimeout(playAmplified, 150);
        } else {
          loadedStyleUrl.current = targetStyleUrl;
          map.setStyle(targetStyleUrl);
          map.once('style.load', playAmplified);
        }
      } else if (mapStyle.startsWith('mapbox://') && mapStyle.includes('|')) {
        // Custom Standard URL (pipe format: mapbox://url|preset|theme) — treat like Standard 3D
        if (mapEl) { mapEl.style.transition = 'opacity 150ms ease'; mapEl.style.opacity = '0'; }

        const applyCustomStandard = () => {
          try {
            map.setConfigProperty('basemap', 'lightPreset', lightPreset);
            map.setConfigProperty('basemap', 'theme', theme);
            map.setConfigProperty('basemap', 'showPointOfInterestLabels', false);
            map.setConfigProperty('basemap', 'showTransitLabels', false);
            map.setConfigProperty('basemap', 'showRoadLabels', false);
            map.setConfigProperty('basemap', 'show3dObjects', true);
            map.setConfigProperty('basemap', 'show3dBuildings', true);
          } catch {}
          map.easeTo({ pitch: 65, duration: 600 });
          fadeIn();
        };

        if (styleAlreadyLoaded) {
          setTimeout(applyCustomStandard, 150);
        } else {
          loadedStyleUrl.current = targetStyleUrl;
          map.setStyle(targetStyleUrl);
          map.once('style.load', applyCustomStandard);
        }
      } else {
        // Classic/full URL style — swap the style and flatten to top view
        if (mapEl) { mapEl.style.transition = 'opacity 150ms ease'; mapEl.style.opacity = '0'; }

        const applyClassic = () => {
          hidePoiLabels(map);
          disableClassic3dBuildings(map);
          map.easeTo({ pitch: 0, duration: 600 });
          fadeIn();
        };

        if (styleAlreadyLoaded) {
          setTimeout(applyClassic, 150);
        } else {
          loadedStyleUrl.current = targetStyleUrl;
          map.setStyle(targetStyleUrl);
          map.once('style.load', applyClassic);
        }
      }
    }, [mapStyle]);

    // Fly to new center when the center prop changes (BOPIS toggle / address override)
    // For amplified styles, fly to the animation start-state pitch/bearing so those tiles are
    // pre-loaded in the tile cache before reset() jumpTo's there — otherwise idle stalls.
    const centerInitialized = useRef(false);
    useEffect(() => {
      if (!mapInstance.current) return;
      if (!centerInitialized.current) { centerInitialized.current = true; return; }
      const target = center ?? DELIVERY_LOCATION;
      const isAmplifiedFly = mapStyle.startsWith('amplified');
      const isZoomInFly = mapStyle.includes('zoomin');
      mapInstance.current.flyTo({
        center: target,
        zoom: 15.5,
        ...(isAmplifiedFly ? {
          pitch: isZoomInFly ? 72 : 60,
          bearing: isZoomInFly ? 32 : 6,
        } : {}),
        duration: 1200,
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
      } as any);
    }, [center]);

    // Expose reset method for replay
    useImperativeHandle(ref, () => ({
      reset: () => {
        if (!mapInstance.current) return;
        const map = mapInstance.current;
        readyFired.current = false;
        hasAnimated.current = false;

        const mapEl = document.getElementById('map');
        if (mapEl) mapEl.classList.remove('fade-in');

        const isCustomStdReset = mapStyle.startsWith('mapbox://') && mapStyle.includes('|');
        const isClassicReset = mapStyle.startsWith('mapbox://') && !mapStyle.includes('/standard') && !isCustomStdReset;
        const isAmplifiedReset = mapStyle.startsWith('amplified');
        const isZoomInReset = mapStyle.includes('zoomin');
        map.jumpTo({
          center: centerRef.current,
          zoom: reduceMotion ? 14.75 : (isZoomInReset ? 15.5 : isAmplifiedReset ? 15.5 : 14.25),
          pitch: reduceMotion ? (isAmplifiedReset ? 35 : (isClassicReset ? 0 : 65)) : (isZoomInReset ? 72 : isAmplifiedReset ? 60 : 22.5),
          bearing: reduceMotion ? 12 : (isZoomInReset ? 32 : 6),
          offset: cameraOffset,
        } as any);

        map.once('idle', () => {
          setTimeout(() => {
            readyFired.current = true;
            onReady();
            startAnimation(map);
          }, 100);
        });
      },
    }));

    return <div id="map" ref={mapContainer} />;
  }
);

MapView.displayName = 'MapView';

export default MapView;
