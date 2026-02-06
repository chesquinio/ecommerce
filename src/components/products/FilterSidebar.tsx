"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BrandFilter } from "./BrandFilter"
import { PriceFilter } from "./PriceFilter"
import { CategoryFilter } from "./CategoryFilter"
import { Brand, Category, FilterState } from "@/types"

interface FilterSidebarProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  categories: Category[]
  brands: Brand[]
}

export function FilterSidebar({ filters, onFiltersChange, categories, brands }: FilterSidebarProps) {
  const hasActiveFilters =
    filters.brands.length > 0 ||
    filters.categories.length > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 10000

  const handleClearFilters = () => {
    onFiltersChange({
      brands: [],
      categories: [],
      priceRange: [0, 10000],
      sortBy: filters.sortBy,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filtros</h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-auto p-0 text-sm text-primary hover:text-primary/80"
          >
            Limpiar
            <X className="ml-1 h-3 w-3" />
          </Button>
        )}
      </div>

      <BrandFilter
        brands={brands}
        selectedBrands={filters.brands}
        onBrandsChange={(brands) =>
          onFiltersChange({ ...filters, brands })
        }
      />

      <PriceFilter
        priceRange={filters.priceRange}
        maxPrice={10000}
        onPriceChange={(priceRange) =>
          onFiltersChange({ ...filters, priceRange })
        }
      />

      <CategoryFilter
        categories={categories}
        selectedCategories={filters.categories}
        onCategoriesChange={(categories) =>
          onFiltersChange({ ...filters, categories })
        }
      />
    </div>
  )
}
