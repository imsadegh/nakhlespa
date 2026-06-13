export function Footer() {
  return (
    <footer id="contact" className="relative z-10 border-t mt-16 py-10"
      style={{ borderColor: 'var(--border-base)' }}>
      <div className="mx-auto max-w-screen-xl px-4 sm:px-8 lg:px-16 sm:flex sm:items-center sm:justify-between">
        <div className="text-center sm:text-right mb-4 sm:mb-0">
          <div className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            نخل<span className="text-[#C6A55B]">سپا</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>مرکز ماساژ و آرامش</p>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>قم، پردیسان — تلفن: ۰۲۱-XXXXXXXX</p>
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>© ۱۴۰۵ نخلسپا. تمام حقوق محفوظ است.</p>
        </div>
      </div>
    </footer>
  )
}
