import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MapPin, Calendar, Star, ArrowLeft, Tag } from "lucide-react"
import { mockEntries, mockLocations } from "@/lib/mock-data"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function EntryDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const entry = mockEntries.find((e) => e.id === id)

  if (!entry) {
    notFound()
  }

  const location = mockLocations.find((l) => l.id === entry.locationId)

  // Get related entries from the same location
  const relatedEntries = mockEntries.filter((e) => e.locationId === entry.locationId && e.id !== entry.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">TripJournal</h1>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Entries
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Image */}
        <div className="aspect-video w-full rounded-xl overflow-hidden mb-8 shadow-lg">
          <img src={entry.images[0] || "/placeholder.svg"} alt={entry.title} className="w-full h-full object-cover" />
        </div>

        {/* Entry Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3 text-balance">{entry.title}</h1>
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span className="text-lg">
                    {location?.name}, {location?.country}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-lg">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-yellow-50 px-4 py-2 rounded-lg">
              <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              <span className="text-2xl font-bold text-gray-900">{entry.rating}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Description */}
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">About This Experience</h2>
          <p className="text-gray-700 leading-relaxed text-lg">{entry.description}</p>
        </Card>

        {/* Location Map Preview */}
        {location && (
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Location</h2>
            <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100" />
              <div className="relative z-10 text-center">
                <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                <p className="text-xl font-semibold text-gray-900">
                  {location.name}, {location.country}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {location.coordinates.lat.toFixed(4)}°, {location.coordinates.lng.toFixed(4)}°
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Related Entries */}
        {relatedEntries.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">More from {location?.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedEntries.map((relatedEntry) => (
                <Link key={relatedEntry.id} href={`/entry/${relatedEntry.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <div className="aspect-video relative bg-gray-100">
                      <img
                        src={relatedEntry.images[0] || "/placeholder.svg"}
                        alt={relatedEntry.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2">{relatedEntry.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(relatedEntry.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{relatedEntry.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{relatedEntry.description}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
