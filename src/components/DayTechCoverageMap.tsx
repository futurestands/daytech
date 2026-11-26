import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AdvancedMarker,
  APILoadingStatus,
  APIProvider,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { ArrowRight, Compass, Loader2, MapPin, Navigation, Search, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { isQuotaExceededError, useAutocompleteSuggestions } from '../hooks/useAutocompleteSuggestions';

interface CoverageHub {
  id: string;
  label: string;
  role: string;
  textQuery: string;
}

interface ResolvedPlaceData {
  id: string;
  label: string;
  role: string;
  displayName: string;
  formattedAddress: string;
  location: google.maps.LatLngLiteral;
  viewport?: google.maps.LatLngBoundsLiteral | google.maps.LatLngBounds;
}

const REGIONAL_HUBS: CoverageHub[] = [
  {
    id: 'kampala',
    label: 'Kampala HQ Hub',
    role: 'Primary Software & Infrastructure Engineering Base',
    textQuery: 'Kampala, Uganda',
  },
  {
    id: 'entebbe',
    label: 'Entebbe',
    role: 'Aviation, Hospitality & Enterprise Deployment Zone',
    textQuery: 'Entebbe, Uganda',
  },
  {
    id: 'jinja',
    label: 'Jinja',
    role: 'Industrial, Manufacturing & WaterOps Corridor',
    textQuery: 'Jinja, Uganda',
  },
  {
    id: 'nairobi',
    label: 'Nairobi',
    role: 'East Africa Regional Enterprise Desk',
    textQuery: 'Nairobi, Kenya',
  },
  {
    id: 'kigali',
    label: 'Kigali',
    role: 'Regional FinTech & Public Sector Delivery',
    textQuery: 'Kigali, Rwanda',
  },
];

// Generic regional viewport center before Places API resolves exact hub location
const INITIAL_EAST_AFRICA_CENTER: google.maps.LatLngLiteral = { lat: 0.35, lng: 32.58 };

function toLatLngLiteral(loc: google.maps.LatLng | google.maps.LatLngLiteral): google.maps.LatLngLiteral {
  if (typeof (loc as google.maps.LatLng).lat === 'function') {
    const fnLoc = loc as google.maps.LatLng;
    return { lat: fnLoc.lat(), lng: fnLoc.lng() };
  }
  return loc as google.maps.LatLngLiteral;
}

interface MarkerWithInfoProps {
  place: ResolvedPlaceData;
  isSelected: boolean;
  onSelect: () => void;
  onCloseInfo: () => void;
  showInfo: boolean;
  isPrimaryHub?: boolean;
}

function PlaceMarker({
  place,
  isSelected,
  onSelect,
  onCloseInfo,
  showInfo,
  isPrimaryHub = false,
}: MarkerWithInfoProps) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={place.location}
        title={place.displayName}
        onClick={onSelect}
        zIndex={isSelected ? 1000 : isPrimaryHub ? 500 : 100}
      >
        <Pin
          background={isSelected ? '#2563EB' : isPrimaryHub ? '#0B1120' : '#06B6D4'}
          borderColor="#FFFFFF"
          glyphColor="#FFFFFF"
        />
      </AdvancedMarker>
      {showInfo && marker && (
        <InfoWindow anchor={marker} pixelOffset={[0, -4]} onCloseClick={onCloseInfo}>
          <div className="max-w-xs p-1 text-slate-900">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#2563EB]">
              {place.role}
            </p>
            <p className="mt-0.5 text-sm font-bold text-[#0B1120]">{place.displayName}</p>
            <p className="mt-1 text-xs text-slate-600 leading-snug">{place.formattedAddress}</p>
            <p className="mt-1.5 font-mono text-[11px] text-slate-500">
              {place.location.lat.toFixed(4)}, {place.location.lng.toFixed(4)}
            </p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function InteractiveMapContent({ initialQuery }: { initialQuery: string }) {
  const { theme } = useAppContext();
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const apiStatus = useApiLoadingStatus();

  const [hubCache, setHubCache] = useState<Record<string, ResolvedPlaceData>>({});
  const [activeHubId, setActiveHubId] = useState<string>('kampala');
  const [customPlace, setCustomPlace] = useState<ResolvedPlaceData | null>(null);
  const [infoOpenId, setInfoOpenId] = useState<string | null>('kampala');
  const [loadingHub, setLoadingHub] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('roadmap');

  const { suggestions, isLoading: suggestionsLoading, error: autocompleteError, resetSession } =
    useAutocompleteSuggestions(searchInput, {
      includedRegionCodes: ['ug', 'ke', 'rw', 'tz', 'bi', 'ss'],
    });

  const focusPlaceOnMap = useCallback(
    (resolved: ResolvedPlaceData) => {
      if (!map) return;
      if (resolved.viewport) {
        map.fitBounds(resolved.viewport);
      } else {
        map.panTo(resolved.location);
        map.setZoom(13);
      }
    },
    [map]
  );

  const resolveHub = useCallback(
    async (hub: CoverageHub, queryOverride?: string) => {
      setActiveHubId(hub.id);
      setCustomPlace(null);
      setLookupError(null);

      const cached = hubCache[hub.id];
      if (cached && !queryOverride) {
        setInfoOpenId(hub.id);
        focusPlaceOnMap(cached);
        return;
      }

      if (!placesLib) return;

      setLoadingHub(true);
      try {
        const textQuery = queryOverride || hub.textQuery;
        const response = await placesLib.Place.searchByText({
          textQuery,
          fields: ['id', 'displayName', 'formattedAddress', 'location', 'viewport'],
          maxResultCount: 1,
        });

        const place = response?.places?.[0];
        if (!place || !place.location) {
          setLookupError(`Unable to locate "${textQuery}" via Google Places.`);
          return;
        }

        const resolved: ResolvedPlaceData = {
          id: hub.id,
          label: hub.label,
          role: hub.role,
          displayName: place.displayName || hub.label,
          formattedAddress: place.formattedAddress || textQuery,
          location: toLatLngLiteral(place.location),
          viewport: place.viewport ?? undefined,
        };

        setHubCache((prev) => ({ ...prev, [hub.id]: resolved }));
        setInfoOpenId(hub.id);
        focusPlaceOnMap(resolved);
      } catch (err) {
        if (isQuotaExceededError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        setLookupError('Unable to load regional location data. Please check your network or API quota.');
      } finally {
        setLoadingHub(false);
      }
    },
    [placesLib, hubCache, focusPlaceOnMap]
  );

  // Resolve primary operations base once Places library is ready
  useEffect(() => {
    if (!placesLib || hubCache.kampala) return;
    const primaryHub: CoverageHub = {
      ...REGIONAL_HUBS[0],
      textQuery: initialQuery || REGIONAL_HUBS[0].textQuery,
    };
    void resolveHub(primaryHub, initialQuery || undefined);
  }, [placesLib, hubCache.kampala, initialQuery, resolveHub]);

  const handleSelectSuggestion = async (suggestion: google.maps.places.AutocompleteSuggestion) => {
    if (!placesLib || !suggestion.placePrediction) return;
    setLookupError(null);
    setLoadingHub(true);
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({
        fields: ['id', 'displayName', 'formattedAddress', 'location', 'viewport'],
      });

      if (!place.location) {
        setLookupError('Selected place did not include geographic coordinates.');
        return;
      }

      const resolved: ResolvedPlaceData = {
        id: `custom-${place.id || Date.now()}`,
        label: place.displayName || 'Client Site',
        role: 'Selected Client / Project Site',
        displayName: place.displayName || suggestion.placePrediction.text.text,
        formattedAddress: place.formattedAddress || suggestion.placePrediction.text.text,
        location: toLatLngLiteral(place.location),
        viewport: place.viewport ?? undefined,
      };

      setCustomPlace(resolved);
      setInfoOpenId(resolved.id);
      setSearchInput('');
      resetSession();
      focusPlaceOnMap(resolved);
    } catch (err) {
      if (isQuotaExceededError(err)) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
      setLookupError('Unable to retrieve place details. Please check your network or API quota.');
    } finally {
      setLoadingHub(false);
    }
  };

  if (apiStatus === APILoadingStatus.FAILED || apiStatus === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="h-[420px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120] flex flex-col items-center justify-center p-6 text-center">
        <MapPin className="w-8 h-8 text-slate-400" />
        <p className="mt-3 text-sm font-semibold text-[#0B1120] dark:text-white">
          Interactive map is temporarily unavailable
        </p>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-md">
          Please check your network connection or API key quota. You can still submit project enquiries and demo requests using the forms on this page.
        </p>
      </div>
    );
  }

  const resolvedList = Object.values(hubCache);
  const activeDisplayPlace = customPlace || hubCache[activeHubId] || null;

  return (
    <div className="space-y-4">
      {/* Toolbar: Hub Switcher + Site Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {REGIONAL_HUBS.map((hub) => {
            const active = !customPlace && activeHubId === hub.id;
            return (
              <button
                key={hub.id}
                type="button"
                onClick={() => void resolveHub(hub)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  active
                    ? 'bg-[#2563EB] border-[#2563EB] text-white'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-slate-700 dark:text-slate-300 hover:border-[#2563EB]/50'
                }`}
              >
                {hub.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search your office or site in East Africa..."
              aria-label="Search office or deployment site address"
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-xs sm:text-sm text-[#0B1120] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  resetSession();
                }}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {(suggestions.length > 0 || suggestionsLoading) && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#020617] shadow-xl overflow-hidden">
                {suggestionsLoading && (
                  <div className="px-3.5 py-2.5 text-xs text-slate-500 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Searching places...</span>
                  </div>
                )}
                {suggestions.map((item, idx) => (
                  <button
                    key={item.placePrediction?.placeId || idx}
                    type="button"
                    onClick={() => void handleSelectSuggestion(item)}
                    className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-900 border-b last:border-b-0 border-slate-100 dark:border-slate-800 flex items-start gap-2.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#06B6D4] mt-0.5 shrink-0" />
                    <span className="text-[#0B1120] dark:text-slate-200">
                      {item.placePrediction?.text.text}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMapTypeId((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0"
          >
            {mapTypeId === 'roadmap' ? 'Satellite' : 'Map'}
          </button>
        </div>
      </div>

      {(lookupError || autocompleteError) && (
        <div className="px-3.5 py-2.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-900 dark:text-amber-200">
          {lookupError || autocompleteError}
        </div>
      )}

      {/* Map Canvas Container (Explicit CSS Height required by CF2) */}
      <div className="relative h-[420px] w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#0B1120]">
        <GoogleMap
          mapId="DEMO_MAP_ID"
          defaultCenter={INITIAL_EAST_AFRICA_CENTER}
          defaultZoom={6}
          gestureHandling="cooperative"
          mapTypeId={mapTypeId}
          colorScheme={
            theme === 'dark'
              ? ('DARK' as google.maps.ColorScheme)
              : ('LIGHT' as google.maps.ColorScheme)
          }
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
        >
          {resolvedList.map((place) => (
            <PlaceMarker
              key={place.id}
              place={place}
              isPrimaryHub={place.id === 'kampala'}
              isSelected={!customPlace && activeHubId === place.id}
              showInfo={infoOpenId === place.id}
              onSelect={() => {
                setCustomPlace(null);
                setActiveHubId(place.id);
                setInfoOpenId(place.id);
              }}
              onCloseInfo={() => setInfoOpenId(null)}
            />
          ))}

          {customPlace && (
            <PlaceMarker
              place={customPlace}
              isSelected
              showInfo={infoOpenId === customPlace.id}
              onSelect={() => setInfoOpenId(customPlace.id)}
              onCloseInfo={() => setInfoOpenId(null)}
            />
          )}
        </GoogleMap>

        {loadingHub && (
          <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-white/95 dark:bg-[#020617]/95 border border-slate-200 dark:border-slate-700 text-xs font-medium text-[#0B1120] dark:text-white flex items-center gap-2 shadow-sm">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
            <span>Locating site...</span>
          </div>
        )}
      </div>

      {/* Active Place Detail Bar */}
      {activeDisplayPlace && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Compass className="w-5 h-5 text-[#2563EB] dark:text-[#06B6D4] mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                {activeDisplayPlace.role}
              </p>
              <p className="text-sm font-bold text-[#0B1120] dark:text-white">
                {activeDisplayPlace.displayName} — {activeDisplayPlace.formattedAddress}
              </p>
            </div>
          </div>
          <Link
            to={`/quote?location=${encodeURIComponent(activeDisplayPlace.formattedAddress)}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shrink-0"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Request Quote for This Location</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Map &amp; location search powered by Google Maps Platform. Subject to the{' '}
        <a
          href="https://maps.google.com/help/terms_maps/?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-[#2563EB]"
        >
          Google Maps End User Terms
        </a>
        .
      </p>
    </div>
  );
}

export function DayTechCoverageMap() {
  const { publicConfig } = useAppContext();
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || '';

  if (!mapsApiKey) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-[#2563EB] dark:text-[#06B6D4] mt-0.5 shrink-0" />
          <div>
            <h3 className="font-display text-base font-bold text-[#0B1120] dark:text-white">
              Regional Delivery Coverage Map
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              DayTech Solutions operates from Uganda across East Africa (Kampala, Entebbe, Jinja, Nairobi, and Kigali). Interactive map rendering activates when a Google Maps browser key is present in the runtime environment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] p-6 sm:p-8">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4]">
            Regional Footprint &amp; Site Lookup
          </p>
          <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold text-[#0B1120] dark:text-white">
            Operations Coverage &amp; Client Site Pinning
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select a regional hub or search your office address for site-survey scoping.
        </p>
      </div>

      <APIProvider apiKey={mapsApiKey} libraries={['places', 'marker']} language="en" region="UG">
        <InteractiveMapContent initialQuery={publicConfig.officialAddress || 'Kampala, Uganda'} />
      </APIProvider>
    </div>
  );
}
