import { useInfer } from '@pro6pp/infer-react';

export const AddressForm = () => {
  const { state, inputProps, selectItem } = useInfer({
    authKey: 'AUTH_KEY',
    country: 'NL',
    limit: 5,
    apiUrl: 'http://localhost:8081/v2/',
  });

  return (
    <div className="relative w-full max-w-md">
      <label className="block text-sm font-bold mb-1">Address</label>
      <input
        {...inputProps}
        placeholder="1234AB 12 or Amsterdam"
        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
      />
      {(state.cities.length > 0 || state.streets.length > 0 || state.suggestions.length > 0) && (
        <ul className="absolute z-10 w-full bg-white border border-gray-200 shadow-lg rounded mt-1 max-h-60 overflow-auto">
          {state.cities.map((city, i) => (
            <li
              key={i}
              onClick={() => selectItem(city)}
              className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
            >
              <span className="font-semibold">{city.label}</span>
              <span className="text-xs text-gray-500 ml-2">City</span>
            </li>
          ))}
          {state.streets.map((street, i) => (
            <li
              key={i}
              onClick={() => selectItem(street)}
              className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
            >
              <span className="font-semibold">{street.label}</span>
              <span className="text-xs text-gray-500 ml-2">Street</span>
            </li>
          ))}
          {state.suggestions.map((item, i) => (
            <li
              key={i}
              onClick={() => selectItem(item)}
              className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
            >
              {item.label}
              {item.subtitle && <span className="text-gray-400 ml-1">({item.subtitle})</span>}
            </li>
          ))}
        </ul>
      )}
      {state.isLoading && <div className="text-xs text-gray-400 mt-1">Searching...</div>}
      {state.isValid && <div className="text-xs text-green-600 mt-1">✓ Valid Address</div>}
    </div>
  );
};
