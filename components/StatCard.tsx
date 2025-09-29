interface StatCardProps {
  title: string;
  value: string | number;
}

export default function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="glassmorphism p-6 rounded-lg">
      <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
      <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
  );
}