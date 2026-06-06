const skeletonRows = Array.from({ length: 6 }, (_, index) => index)
const skeletonCards = Array.from({ length: 4 }, (_, index) => index)

export default function DashboardLoading() {
  return (
    <div className="grid gap-4" aria-label="Loading dashboard content">
      <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-2">
            <div className="h-5 w-56 rounded-md bg-[#E5E7EB]" />
            <div className="h-4 w-80 max-w-full rounded-md bg-[#F1F5F9]" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 rounded-md bg-[#F1F5F9]" />
            <div className="h-9 w-28 rounded-md bg-[#F1F5F9]" />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {skeletonCards.map((item) => (
          <div key={item} className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <div className="h-4 w-28 rounded-md bg-[#F1F5F9]" />
            <div className="mt-4 h-7 w-20 rounded-md bg-[#E5E7EB]" />
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
        <div className="border-b border-[#E5E7EB] p-5">
          <div className="h-5 w-44 rounded-md bg-[#E5E7EB]" />
          <div className="mt-2 h-4 w-72 max-w-full rounded-md bg-[#F1F5F9]" />
        </div>
        <div className="grid gap-3 p-5">
          {skeletonRows.map((item) => (
            <div key={item} className="grid gap-3 rounded-md border border-[#F1F5F9] p-3 md:grid-cols-[1fr_160px_120px]">
              <div className="h-4 rounded-md bg-[#F1F5F9]" />
              <div className="h-4 rounded-md bg-[#F1F5F9]" />
              <div className="h-4 rounded-md bg-[#F1F5F9]" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
