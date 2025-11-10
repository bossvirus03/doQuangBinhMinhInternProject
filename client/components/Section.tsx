export default function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <div className="container-narrow">
        <div className="border-b pb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary">{title}</h2>
        </div>
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          {children}
        </div>
      </div>
    </section>
  );
}
