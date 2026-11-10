function Footer() {
  return (
    <footer className="mt-16 border-t border-emerald-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between md:px-6">
        <p>GameReview โปรเจกต์รีวิวเกม</p>
        <p className="text-xs">
          ข้อมูลเกมจาก <a href="https://www.igdb.com" target="_blank" rel="noreferrer" className="text-emerald-600 underline">IGDB</a>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
