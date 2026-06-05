const getDestinationValue = (destination) =>
  destination?.slug || destination?.name || destination?.destination || '';

const getDestinationName = (destination) =>
  destination?.name || destination?.destination || destination?.slug || '';

export const isCustomizableDestination = (destination) =>
  destination?.customize === true || destination?.is_customizable === true;

export const getDestinationHref = (destination, { traveller } = {}) => {
  const value = getDestinationValue(destination);

  if (isCustomizableDestination(destination)) {
    const destinationName = getDestinationName(destination);
    const params = new URLSearchParams();
    if (traveller) params.set('traveller', traveller);
    if (destinationName) params.set('dest', destinationName);

    const query = params.toString();
    return traveller ? `/customize?${query}` : `/customize?traveller${query ? `&${query}` : ''}`;
  }

  const params = new URLSearchParams();
  if (value) params.set('destination', value);

  const query = params.toString();
  return query ? `/tours?${query}` : '/tours';
};
