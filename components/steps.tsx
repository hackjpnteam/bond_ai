// components/steps.tsx
export default function Steps({ steps }: { steps: { title: string; text: string }[] }) {
  return (
    <ol className="grid gap-6 md:grid-cols-3">
      {steps.map((s, i) => (
        <li key={i} className="relative rounded-2xl border-2 border-cyan-100 p-8 bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-cyan-300">
          <span className="absolute -top-4 left-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 text-white text-base font-bold shadow-lg">
            {i + 1}
          </span>
          <h4 className="mt-2 text-lg font-semibold text-gray-900">{s.title}</h4>
          <p className="mt-2 text-sm text-gray-600">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}