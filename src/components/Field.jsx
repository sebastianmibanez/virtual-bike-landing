export default function Field({ label, name, type = 'text', placeholder, value, onChange, required, accentColor }) {
  const borderColor = accentColor || 'rgba(255,255,255,0.3)'
  const focusClass = accentColor ? '' : 'focus:border-[#f5e400]'
  return (
    <div className="pt-2">
      <label className="block text-sm text-white/70 uppercase tracking-wider mb-3" style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, letterSpacing: '0.15em' }}>
        {label} {required && <span className="text-[#f5e400]">*</span>}
      </label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder} required={required}
        className={`w-full border-b text-white px-0 py-4 focus:outline-none transition-all placeholder-white/30 text-base bg-transparent ${focusClass}`}
        style={{ borderColor }}
      />
    </div>
  )
}
