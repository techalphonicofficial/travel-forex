const CSS_VARIABLE_NAME_PATTERN = /^--[a-zA-Z0-9-_]+$/;
const BLOCKED_CSS_VALUE_PATTERN = /[;{}<>`]|url\s*\(|expression\s*\(|@import/i;

const isSafeThemeValue = (value) => {
  if (typeof value !== 'string') return false;

  const trimmed = value.trim();

  return (
    trimmed.length > 0 &&
    trimmed.length <= 320 &&
    !BLOCKED_CSS_VALUE_PATTERN.test(trimmed)
  );
};

export const normalizeThemeVariables = (variables = {}) => Object.fromEntries(
  Object.entries(variables).filter(([key, value]) => (
    CSS_VARIABLE_NAME_PATTERN.test(key) && isSafeThemeValue(value)
  ))
);

export const withDerivedThemeVariables = (variables = {}) => {
  const primary = variables['--color-primary'] || variables['--brand-primary'];
  const primaryHover = variables['--color-primary-hover'] || variables['--brand-primary-hover'];
  const secondary = variables['--color-secondary'] || variables['--brand-secondary'];
  const secondaryHover = variables['--color-secondary-hover'] || variables['--brand-secondary-hover'];

  return {
    ...variables,
    ...(!variables['--gradient-primary'] && primary && primaryHover
      ? { '--gradient-primary': `linear-gradient(135deg, ${primary} 0%, ${primaryHover} 100%)` }
      : {}),
    ...(!variables['--gradient-warm'] && secondary && secondaryHover
      ? { '--gradient-warm': `linear-gradient(135deg, ${secondary} 0%, ${secondaryHover} 100%)` }
      : {}),
  };
};

export const normalizeThemePayload = (payload) => {
  if (!payload?.success) return {};

  return withDerivedThemeVariables({
    ...normalizeThemeVariables(payload.data?.css_variables),
    ...normalizeThemeVariables(payload.data?.rgb_variables),
  });
};
