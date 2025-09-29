export default function TourLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-200 to-orange-200 rounded-full flex items-center justify-center mr-4 animate-pulse"></div>
            <div>
              <div className="h-12 w-96 bg-gradient-to-r from-purple-200 to-orange-200 rounded-lg animate-pulse mb-2"></div>
              <div className="h-6 w-80 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* Category Filter Skeleton */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {Array.from({ length: 11 }).map((_, index) => (
              <div
                key={index}
                className="h-10 w-24 bg-gradient-to-r from-purple-200 to-orange-200 rounded-lg animate-pulse"
              ></div>
            ))}
          </div>

          {/* Tour Controls Skeleton */}
          <div className="flex items-center justify-center space-x-6 mb-8">
            <div className="w-12 h-12 bg-purple-200 rounded-lg animate-pulse"></div>
            <div className="w-12 h-12 bg-gradient-to-r from-purple-200 to-orange-200 rounded-lg animate-pulse"></div>
            <div className="w-12 h-12 bg-orange-200 rounded-lg animate-pulse"></div>
            <div className="flex items-center space-x-3 ml-6">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-40 h-2 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Step Navigation Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border-2 border-purple-200 p-6 shadow-lg">
              <div className="h-8 w-48 bg-gradient-to-r from-purple-200 to-orange-200 rounded-lg animate-pulse mb-6"></div>
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl animate-pulse"
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 w-48 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Current Step Content Skeleton */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border-2 border-purple-200 p-8 shadow-lg">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-200 to-orange-200 rounded-full animate-pulse"></div>
                  <div>
                    <div className="h-8 w-64 bg-gradient-to-r from-purple-200 to-orange-200 rounded-lg animate-pulse mb-2"></div>
                    <div className="h-5 w-80 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                </div>
                <div className="h-6 w-20 bg-purple-200 rounded-full animate-pulse"></div>
              </div>

              {/* Features List Skeleton */}
              <div className="mb-8">
                <div className="h-6 w-32 bg-gradient-to-r from-purple-200 to-orange-200 rounded-lg animate-pulse mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 rounded-lg">
                      <div className="w-3 h-3 bg-gradient-to-r from-purple-200 to-orange-200 rounded-full animate-pulse"></div>
                      <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Content Skeleton */}
              <div>
                <div className="h-6 w-40 bg-gradient-to-r from-purple-200 to-orange-200 rounded-lg animate-pulse mb-4"></div>
                <div className="border-2 border-purple-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white">
                  <div className="space-y-4">
                    <div className="h-32 w-full bg-gradient-to-r from-purple-100 to-orange-100 rounded-lg animate-pulse"></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-24 bg-purple-100 rounded-lg animate-pulse"></div>
                      <div className="h-24 bg-orange-100 rounded-lg animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Footer Skeleton */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white rounded-xl border-2 border-purple-200 p-6 text-center shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-200 to-orange-200 rounded-full mx-auto mb-3 animate-pulse"></div>
              <div className="h-8 w-16 bg-gradient-to-r from-purple-200 to-orange-200 rounded mx-auto mb-2 animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-200 rounded mx-auto animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Call to Action Skeleton */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-orange-500 rounded-xl p-12 shadow-lg">
            <div className="h-10 w-96 bg-white/20 rounded-lg mx-auto mb-6 animate-pulse"></div>
            <div className="h-6 w-80 bg-white/20 rounded-lg mx-auto mb-8 animate-pulse"></div>
            <div className="flex flex-wrap justify-center gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-12 w-40 bg-white/20 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
