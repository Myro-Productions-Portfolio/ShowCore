import data from './data.json'
import { TechnicianDiscovery } from './components/TechnicianDiscovery'
import type { Technician, Filters, SearchState } from './types'

export default function TechnicianDiscoveryView() {
  // Cast the JSON data to proper types
  const technicians = data.technicians as Technician[]
  const filters = data.filters as Filters
  const searchState = data.searchState as SearchState

  return (
    <TechnicianDiscovery
      technicians={technicians}
      filters={filters}
      searchState={searchState}
      isLoading={false}
      onSearch={(query) => console.log('Search:', query)}
      onFilterChange={(newFilters) => console.log('Filter change:', newFilters)}
      onClearFilters={() => console.log('Clear filters')}
      onViewProfile={(id) => console.log('View profile:', id)}
      onToggleBookmark={(id) => console.log('Toggle bookmark:', id)}
      onViewRanking={(id) => console.log('View ranking:', id)}
      onPageChange={(page) => console.log('Page change:', page)}
    />
  )
}
