/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ebay: {
          bg: {
            primary: 'var(--color-background-primary)',
            secondary: 'var(--color-background-secondary)',
            card: 'var(--color-background-card)',
            tertiary: 'var(--color-background-tertiary)',
          },
          fg: {
            primary: 'var(--color-foreground-primary)',
            secondary: 'var(--color-foreground-secondary)',
            disabled: 'var(--color-foreground-disabled)',
          },
          border: {
            DEFAULT: 'var(--color-border-subtle)',
            subtle: 'var(--color-border-subtle)',
            strong: 'var(--color-border-strong)',
          },
          blue: {
            DEFAULT: 'var(--color-accent-blue)',
            light: 'var(--color-accent-blue-light)',
            dark: 'var(--color-accent-blue-dark)',
          },
          red: {
            DEFAULT: 'var(--color-status-error-fg)',
            bg: 'var(--color-status-error-bg)',
          },
          green: {
            DEFAULT: 'var(--color-status-success-fg)',
            bg: 'var(--color-status-success-bg)',
          },
          amber: {
            DEFAULT: 'var(--color-status-warning-fg)',
            bg: 'var(--color-status-warning-bg)',
          },
          info: {
            DEFAULT: 'var(--color-status-info-fg)',
            bg: 'var(--color-status-info-bg)',
          },
        },
      },
      borderRadius: {
        'ebay-card': '16px',
        'ebay-panel': '12px',
        'ebay-control': '8px',
        'ebay-pill': '9999px',
      },
      boxShadow: {
        'ebay-card': '0 2px 8px 0 rgba(0, 0, 0, 0.06)',
        'ebay-card-hover': '0 8px 24px -4px rgba(0, 0, 0, 0.12)',
        'ebay-elevated': '0 12px 32px 0 rgba(0, 0, 0, 0.16)',
      },
    },
  },
  plugins: [],
};
