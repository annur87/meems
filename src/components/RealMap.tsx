"use client";

import { useEffect, useRef } from 'react';
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
    const mapRef = useRef<any>(null);
    const markersRef = useRef<{ [key: number]: any }>({});
    const containerId = 'leaflet-map-container';

    // Initialize Map
    const initMap = () => {
        if (typeof window === 'undefined' || !window.L || mapRef.current) return;

        mapRef.current = window.L.map(containerId).setView(center, zoom);

        window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',
            maxZoom: 19
        }).addTo(mapRef.current);

        mapRef.current.on('click', (e: any) => {
            if (onMapClick) {
                onMapClick(e.latlng.lat, e.latlng.lng);
            }
        });
    };

    // Update View
    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.setView(center, zoom);
        }
    }, [center, zoom]);

    // Update Markers
    useEffect(() => {
        if (!mapRef.current || !window.L) return;

        // Remove old markers that are not in the new list
        const newIds = new Set(markers.map(m => m.id));
        Object.keys(markersRef.current).forEach(idStr => {
            const id = parseInt(idStr);
            if (!newIds.has(id)) {
                mapRef.current.removeLayer(markersRef.current[id]);
                delete markersRef.current[id];
            }
        });

        // Add or Update markers
        markers.forEach(marker => {
            if (markersRef.current[marker.id]) {
                // Update existing? (Leaflet markers are mutable, but simple remove/add is safer for icon changes)
                // For now, assuming static position, just update icon if needed
                // But to be safe and simple: remove and re-add if color changes
                const existing = markersRef.current[marker.id];
                // Check if color changed (we'd need to store prev color). 
                // For simplicity, let's just update popup content.
                if (marker.popup) {
                    existing.setPopupContent(marker.popup);
                }
                
                // If we want to support color changes, we need custom icons.
                // Standard Leaflet icon is blue. We can use CSS filters or custom SVGs.
                // Let's use a simple circleMarker for flexibility and performance.
                existing.setStyle({ fillColor: marker.color || '#3b82f6', color: '#fff' });
            } else {
                // Create new
                const circle = window.L.circleMarker([marker.lat, marker.lng], {
                    radius: 8,
                    fillColor: marker.color || '#3b82f6',
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(mapRef.current);

                if (marker.popup) {
                    circle.bindPopup(marker.popup);
                }
                
                if (marker.title) {
                    circle.bindTooltip(marker.title);
                }

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
                onLoad={initMap}
            />
            <div id={containerId} style={{ height: '100%', width: '100%', borderRadius: '1rem', zIndex: 0 }} />
        </>
    );
}
