/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			keyframes: {
				"accordion-down": {
					from: { height: 0 },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: 0 },
				},
				"progress": {
					"0%": { strokeDasharray: "0 100" },
				},
				"birthday-gold": {
					"0%, 100%": { "border-color": "#d4a017", "box-shadow": "0 0 8px 1px rgba(212, 160, 23, 0.5)" },
					"50%": { "border-color": "#f5d060", "box-shadow": "0 0 12px 2px rgba(245, 208, 96, 0.6)" },
				},
				"birthday-purple": {
					"0%, 100%": { "border-color": "#7c3aed", "box-shadow": "0 0 8px 1px rgba(124, 58, 237, 0.4)" },
					"50%": { "border-color": "#c084fc", "box-shadow": "0 0 12px 2px rgba(192, 132, 252, 0.5)" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"progress": "progress 1s ease-out forwards",
				"birthday-gold": "birthday-gold 2s ease-in-out infinite",
				"birthday-purple": "birthday-purple 2s ease-in-out infinite",
			},
			colors: {
				blurple: "#5865F2",
			},
		},
	},
	plugins: [require("tailwindcss-animate")],
};
