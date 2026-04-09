'use client';
import { useEffect, useRef, useState } from 'react';

interface AddressResult {
  address: string;
  suburb: string;
  postcode: string;
  state: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: AddressResult) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    google: any;
    initGooglePlaces: () => void;
  }
}

export default function AddressAutocomplete({ value, onChange, onSelect, placeholder, style }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (window.google) {
      setLoaded(true);
      return;
    }

    const scriptId = 'google-places-script';
    if (document.getElementById(scriptId)) {
      const interval = setInterval(() => {
        if (window.google) {
          setLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return;
    }

    window.initGooglePlaces = () => setLoaded(true);
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGooglePlaces`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!loaded || !inputRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'au' },
      fields: ['address_components', 'formatted_address'],
      types: ['address'],
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      if (!place.address_components) return;

      let streetNumber = '';
      let streetName = '';
      let suburb = '';
      let postcode = '';
      let state = '';

      for (const component of place.address_components) {
        const types = component.types;
        if (types.includes('street_number')) streetNumber = component.long_name;
        if (types.includes('route')) streetName = component.long_name;
        if (types.includes('locality')) suburb = component.long_name;
        if (types.includes('postal_code')) postcode = component.long_name;
        if (types.includes('administrative_area_level_1')) state = component.short_name;
      }

      const address = `${streetNumber} ${streetName}`.trim();
      onChange(address);
      onSelect({ address, suburb, postcode, state });
    });
  }, [loaded]);

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || 'Start typing address...'}
      style={style}
    />
  );
}
