import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">SupplyFlow</h1>
        <p className="mt-2 text-lg text-gray-500">Real-Time Supply for Real-World Kitchens</p>
      </div>
    </div>
  );
}
