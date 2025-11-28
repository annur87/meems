"use client";

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

interface MarkerData {
    id: string | number;
    lat: number;
    lng: number;
    title?: string;
    color?: string;
    popup?: string;
    label?: string;
    isBlurred?: boolean;
}

interface RealMapProps {
    center: [number, number];
    zoom: number;
    markers: MarkerData[];
    onMarkerClick?: (id: string | number) => void;
    onMapClick?: (lat: number, lng: number) => void;
    drawingMode?: boolean;
    drawnRectangles?: any[];
    onRectangleDrawn?: (rectangle: any) => void;
    onRectangleDeleted?: (index: number) => void;
}

declare global {
    interface Window {
        L: any;
    }
}

export default function RealMap({ center, zoom, markers, onMarkerClick, onMapClick, drawingMode = false, drawnRectangles = [], onRectangleDrawn, onRectangleDeleted }: RealMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<{ [key: string]: any }>({});
    const latestMapClickRef = useRef<RealMapProps['onMapClick'] | null>(null);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const prevCenterRef = useRef<[number, number]>(center);
    const drawnItemsRef = useRef<any>(null);

    useEffect(() => {
        latestMapClickRef.current = onMapClick;
    }, [onMapClick]);

    // Initialize Map
    useEffect(() => {
        if (!isScriptLoaded || !mapContainerRef.current || !window.L) return;

        if (!mapInstanceRef.current) {
            // Create Map
            const map = window.L.map(mapContainerRef.current).setView(center, zoom);
            mapInstanceRef.current = map;
            prevCenterRef.current = center;

            // Add Tiles (Esri World Street Map)
            window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',
                maxZoom: 19
            }).addTo(map);

            const handleLeafletClick = (e: any) => {
                if (latestMapClickRef.current) {
                    latestMapClickRef.current(e.latlng.lat, e.latlng.lng);
                }
            };
            map.on('click', handleLeafletClick);
            (map as any)._handleLeafletClick = handleLeafletClick;

            // Force resize calculation to fix "grey map" issue
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
            
            // Add drawing layer
            if (window.L.FeatureGroup) {
                drawnItemsRef.current = new window.L.FeatureGroup();
                map.addLayer(drawnItemsRef.current);
                
                // Listen for draw events (only if Leaflet.draw is loaded)
                if (window.L.Draw && window.L.Draw.Event) {
                    map.on(window.L.Draw.Event.CREATED, (e: any) => {
                        const layer = e.layer;
                        drawnItemsRef.current.addLayer(layer);
                        if (onRectangleDrawn) {
                            onRectangleDrawn(layer.toGeoJSON());
                        }
                    });
                    
                    map.on(window.L.Draw.Event.DELETED, (e: any) => {
                        const layers = e.layers;
                        let index = 0;
                        layers.eachLayer(() => {
                            if (onRectangleDeleted) {
                                onRectangleDeleted(index);
                            }
                            index++;
                        });
                    });
                }
            }
        } else {
            // Only update view if center actually changed
            const [prevLat, prevLng] = prevCenterRef.current;
            const [newLat, newLng] = center;
            if (Math.abs(prevLat - newLat) > 0.0001 || Math.abs(prevLng - newLng) > 0.0001) {
                mapInstanceRef.current.setView(center, zoom);
                prevCenterRef.current = center;
            }
        }

        // Cleanup on unmount
        return () => {
            // We don't destroy the map here immediately to avoid flickering if re-renders happen quickly,
            // but in a strict React sense we should. For this specific "game" use case, 
            // keeping it alive might be okay, but let's be safe and destroy if the component is truly unmounting.
            // Actually, for Next.js navigation, it's safer to destroy.
        };
    }, [isScriptLoaded, center, zoom, onMapClick]);

    // Handle Cleanup explicitly
    useEffect(() => {
        return () => {
            if (mapInstanceRef.current) {
                const map = mapInstanceRef.current as any;
                if (map._handleLeafletClick) {
                    map.off('click', map._handleLeafletClick);
                    delete map._handleLeafletClick;
                }
                map.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Update Markers
    useEffect(() => {
        if (!mapInstanceRef.current || !window.L) return;

        const map = mapInstanceRef.current;
        const newIds = new Set(markers.map(m => m.id));

        // Remove old
        Object.keys(markersRef.current).forEach(id => {
            if (!newIds.has(id)) {
                map.removeLayer(markersRef.current[id]);
                delete markersRef.current[id];
            }
        });

        // Add/Update
        markers.forEach(marker => {
            if (markersRef.current[marker.id]) {
                const existing = markersRef.current[marker.id];
                
                // If label status changed, we might need to recreate the icon
                // For simplicity, let's just update the icon if it's a marker
                if (marker.label) {
                    const icon = window.L.divIcon({
                        className: 'custom-label-icon',
                        html: `<div style="
                            background: white; 
                            padding: 2px 6px; 
                            border-radius: 4px; 
                            border: 1px solid #333; 
                            font-weight: bold; 
                            font-size: 12px; 
                            white-space: nowrap;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                            filter: ${marker.isBlurred ? 'blur(4px)' : 'none'};
                            cursor: pointer;
                            transition: filter 0.3s;
                        ">${marker.label}</div>`,
                        iconSize: null, // Auto size
                        iconAnchor: [10, 20] // Approximate center bottom
                    });
                    existing.setIcon(icon);
                } else {
                    // Standard circle marker update
                    existing.setStyle({ fillColor: marker.color || '#3b82f6', color: '#fff' });
                }

                if (marker.popup) existing.setPopupContent(marker.popup);
            } else {
                let layer;
                
                if (marker.label) {
                    const icon = window.L.divIcon({
                        className: 'custom-label-icon',
                        html: `<div style="
                            background: white; 
                            padding: 2px 6px; 
                            border-radius: 4px; 
                            border: 1px solid #333; 
                            font-weight: bold; 
                            font-size: 12px; 
                            white-space: nowrap;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                            filter: ${marker.isBlurred ? 'blur(4px)' : 'none'};
                            cursor: pointer;
                            transition: filter 0.3s;
                        ">${marker.label}</div>`,
                        iconSize: null,
                        iconAnchor: [10, 20]
                    });
                    layer = window.L.marker([marker.lat, marker.lng], { icon }).addTo(map);
                } else {
                    layer = window.L.circleMarker([marker.lat, marker.lng], {
                        radius: 5, // Reduced from 8 to 5 for smaller markers
                        fillColor: marker.color || '#3b82f6',
                        color: '#fff',
                        weight: 1.5, // Reduced from 2 to 1.5 for thinner border
                        opacity: 1,
                        fillOpacity: 0.8
                    }).addTo(map);
                }

                if (marker.popup) layer.bindPopup(marker.popup);
                if (marker.title && !marker.label) layer.bindTooltip(marker.title);

                layer.on('click', () => {
                    if (onMarkerClick) onMarkerClick(marker.id);
                });

                markersRef.current[marker.id] = layer;
            }
        });
    }, [markers, onMarkerClick]);
    
    // Handle Drawing Mode
    useEffect(() => {
        if (!mapInstanceRef.current || !window.L || !window.L.Control || !window.L.Control.Draw) return;
        
        const map = mapInstanceRef.current;
        
        if (drawingMode && !map._drawControl) {
            // Add drawing controls
            const drawControl = new window.L.Control.Draw({
                draw: {
                    rectangle: {
                        shapeOptions: {
                            color: '#3b82f6',
                            weight: 2,
                            fillOpacity: 0.2
                        }
                    },
                    polygon: false,
                    circle: false,
                    marker: false,
                    polyline: false,
                    circlemarker: false
                },
                edit: {
                    featureGroup: drawnItemsRef.current,
                    remove: true
                }
            });
            map.addControl(drawControl);
            map._drawControl = drawControl;
        } else if (!drawingMode && map._drawControl) {
            // Remove drawing controls
            map.removeControl(map._drawControl);
            delete map._drawControl;
        }
    }, [drawingMode]);
    
    // Render persistent rectangles
    useEffect(() => {
        if (!mapInstanceRef.current || !window.L || !drawnItemsRef.current) return;
        
        // Clear existing rectangles
        drawnItemsRef.current.clearLayers();
        
        // Add all rectangles from state
        drawnRectangles.forEach(rectData => {
            if (rectData && rectData.geometry) {
                const layer = window.L.geoJSON(rectData, {
                    style: {
                        color: '#3b82f6',
                        weight: 2,
                        fillOpacity: 0.2
                    }
                });
                drawnItemsRef.current.addLayer(layer);
            }
        });
    }, [drawnRectangles]);

    // Handle Resize
    useEffect(() => {
        if (!mapContainerRef.current || !mapInstanceRef.current) return;

        const resizeObserver = new ResizeObserver(() => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
            }
        });

        resizeObserver.observe(mapContainerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [isScriptLoaded]);

    return (
        <>
            <link 
                rel="stylesheet" 
                href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
                crossOrigin=""
            />
            <link 
                rel="stylesheet" 
                href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css"
                crossOrigin=""
            />
            <Script 
                src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
                integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
                crossOrigin=""
                onLoad={() => setIsScriptLoaded(true)}
                onReady={() => setIsScriptLoaded(true)}
            />
            <Script 
                src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"
                crossOrigin=""
            />
            <div 
                ref={mapContainerRef} 
                style={{ height: '100%', width: '100%', borderRadius: '1rem', zIndex: 0, position: 'relative', overflow: 'hidden' }} 
            />
        </>
    );
}
