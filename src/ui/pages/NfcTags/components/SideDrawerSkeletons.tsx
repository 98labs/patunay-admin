import React from 'react';

export const ArtworkInfoSkeleton: React.FC = () => (
  <div className="space-y-3">
    {/* Artwork Image Skeleton */}
    <div className="mb-3">
      <div className="h-48 w-full rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
    </div>

    {/* Artwork Details Grid Skeleton */}
    <div className="grid grid-cols-2 gap-3">
      <div>
        <span className="text-xs text-gray-500">Title</span>
        <div className="mt-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24" />
      </div>

      <div>
        <span className="text-xs text-gray-500">Artist</span>
        <div className="mt-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20" />
      </div>

      <div>
        <span className="text-xs text-gray-500">Medium</span>
        <div className="mt-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16" />
      </div>

      <div>
        <span className="text-xs text-gray-500">Year</span>
        <div className="mt-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12" />
      </div>

      <div>
        <span className="text-xs text-gray-500">Dimensions</span>
        <div className="mt-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20" />
      </div>

      <div>
        <span className="text-xs text-gray-500">ID Number</span>
        <div className="mt-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16" />
      </div>
    </div>

    {/* Tag Issuer Information Skeleton */}
    <div className="mt-3">
      <div className="flex gap-4">
        <div className="flex-1">
          <span className="text-xs text-gray-500">Tag Issued By</span>
          <div className="mt-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32 mb-1" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-28" />
          </div>
        </div>

        <div className="flex-1">
          <span className="text-xs text-gray-500">Issued At</span>
          <div className="mt-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24" />
        </div>
      </div>
    </div>
  </div>
);

export const UserInfoSkeleton: React.FC = () => (
  <div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32 mb-1" />
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-40" />
  </div>
);

export const CreatorInfoSkeleton: React.FC = () => (
  <div className="space-y-3 border-t border-b pt-4 pb-4">
    {/* Created By and Created At */}
    <div className="flex gap-4">
      <div className="flex-1">
        <h3 className="text-xs font-semibold text-gray-500 uppercase">Created By</h3>
        <div className="mt-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-28 mb-1" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-36" />
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-xs font-semibold text-gray-500 uppercase">Created At</h3>
        <div className="mt-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
      </div>
    </div>

    {/* Updated By and Updated At */}
    <div className="mt-4 flex gap-4">
      <div className="flex-1">
        <h3 className="text-xs font-semibold text-gray-500 uppercase">Updated By</h3>
        <div className="mt-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-28 mb-1" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-36" />
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-xs font-semibold text-gray-500 uppercase">Updated At</h3>
        <div className="mt-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
      </div>
    </div>
  </div>
);