"use client";

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

interface MarkerData {
    id: number;
    lat: number;
    lng: number;
    title?: string;
    color?: string;
    popup?: string;
}

interface RealMapProps {
    center: [number, number];
    zoom: number;
    markers: MarkerData[];
    onMarkerClick?: (id: number) => void;
    onMapClick?: (lat: number, lng: number) => void;
}

declare global {
    interface Window {
        L: any;
    }
}

export default function RealMap({ center, zoom, markers, onMarkerClick, onMapClick }: RealMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<{ [key: number]: any }>({});
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);

    // Initialize Map
    useEffect(() => {
        if (!isScriptLoaded || !mapContainerRef.current || !window.L) return;

        if (!mapInstanceRef.current) {
            // Create Map
            const map = window.L.map(mapContainerRef.current).setView(center, zoom);
            mapInstanceRef.current = map;

            // Add Tiles (Esri World Street Map)
            window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',
                maxZoom: 19
            }).addTo(map);

            // Click Handler
            map.on('click', (e: any) => {
                if (onMapClick) {
                    onMapClick(e.latlng.lat, e.latlng.lng);
                }
            });

            // Force resize calculation to fix "grey map" issue
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        } else {
            // Update View
            mapInstanceRef.current.setView(center, zoom);
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
                mapInstanceRef.current.remove();
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
        Object.keys(markersRef.current).forEach(idStr => {
            const id = parseInt(idStr);
            if (!newIds.has(id)) {
                map.removeLayer(markersRef.current[id]);
                delete markersRef.current[id];
            }
        });

        // Add/Update
        markers.forEach(marker => {
            if (markersRef.current[marker.id]) {
                const existing = markersRef.current[marker.id];
                if (marker.popup) existing.setPopupContent(marker.popup);
                existing.setStyle({ fillColor: marker.color || '#3b82f6', color: '#fff' });
            } else {
                const circle = window.L.circleMarker([marker.lat, marker.lng], {
                    radius: 8,
                    fillColor: marker.color || '#3b82f6',
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(map);

                if (marker.popup) circle.bindPopup(marker.popup);
                if (marker.title) circle.bindTooltip(marker.title);

                circle.on('click', () => {
                    if (onMarkerClick) onMarkerClick(marker.id);
                });

                markersRef.current[marker.id] = circle;
            }
        });
    }, [markers, onMarkerClick]);

    return (
        <>
            <link 
                rel="stylesheet" 
                href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
                crossOrigin=""
            />
            <Script 
                src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
                integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
                crossOrigin=""
                onLoad={() => setIsScriptLoaded(true)}
                onReady={() => setIsScriptLoaded(true)} // Handle case where script is already loaded
            />
            <div 
                ref={mapContainerRef} 
                style={{ height: '100%', width: '100%', borderRadius: '1rem', zIndex: 0 }} 
            />
        </>
    );
}
