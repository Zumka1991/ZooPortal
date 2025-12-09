'use client';

import Select, { StylesConfig, SingleValue } from 'react-select';
import { City } from '@/lib/shelters-api';

interface CitySelectProps {
  cities: City[];
  value: string;
  onChange: (cityId: string) => void;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

interface CityOption {
  value: string;
  label: string;
}

export default function CitySelect({
  cities,
  value,
  onChange,
  required = false,
  placeholder = 'Выберите город',
  disabled = false,
}: CitySelectProps) {
  const options: CityOption[] = cities.map((city) => ({
    value: city.id,
    label: `${city.name}${city.region ? `, ${city.region}` : ''}`,
  }));

  const selectedOption = options.find((opt) => opt.value === value) || null;

  const handleChange = (newValue: SingleValue<CityOption>) => {
    onChange(newValue?.value || '');
  };

  const customStyles: StylesConfig<CityOption, false> = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? '#10b981' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(16, 185, 129, 0.5)' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#10b981' : '#9ca3af',
      },
      padding: '2px',
      borderRadius: '0.5rem',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#10b981'
        : state.isFocused
        ? '#d1fae5'
        : 'white',
      color: state.isSelected ? 'white' : '#111827',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#059669',
      },
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '0.5rem',
      marginTop: '4px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    }),
    input: (provided) => ({
      ...provided,
      margin: '0',
      padding: '0',
    }),
  };

  return (
    <Select<CityOption>
      options={options}
      value={selectedOption}
      onChange={handleChange}
      placeholder={placeholder}
      noOptionsMessage={() => 'Не найдено'}
      styles={customStyles}
      isClearable
      isSearchable
      isDisabled={disabled}
      required={required}
    />
  );
}
