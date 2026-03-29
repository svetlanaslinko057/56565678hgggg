'use client';

import React, { FC, useState, useRef, useEffect } from "react";
import { Star } from "lucide-react";
import {
  FilterButton,
  SortDropdown,
  SortOption,
} from "@/global/Filter/styles";

export type ArenaSortType =
  | "all"
  | "new"
  | "watchlist"
  | "live"
  | "trending"
  | "conditional"
  | "resolved"
  | "my_predictions"
  | "low_stakes"
  | "medium_stakes"
  | "high_stakes"
  | "ends_soon"
  | "my_duels";

interface IProps {
  sortBy: ArenaSortType;
  setSortBy: (value: ArenaSortType) => void;
  tab?: "arena" | "duels" | "leagues";
}

const arenaSortTabs = [
  { key: "all", name: "All" },
  { key: "new", name: "New" },
  { key: "watchlist", name: "Watchlist", icon: "star" },
  { key: "live", name: "Live" },
  { key: "trending", name: "Trending" },
  { key: "conditional", name: "Conditional" },
  { key: "resolved", name: "Resolved" },
  { key: "my_predictions", name: "My Predictions" },
];

const duelsSortTabs = [
  { key: "low_stakes", name: "Low Stakes (USDT 1-99)", icon: "" },
  { key: "medium_stakes", name: "Medium Stakes (USDT 100-999)" },
  { key: "high_stakes", name: "High Stakes (USDT 1,000 +)" },
  { key: "ends_soon", name: "Ends Soon" },
  { key: "my_duels", name: "My Duels" },
];

const ArenaSort: FC<IProps> = ({ sortBy, setSortBy, tab = "arena" }) => {
  const [isActive, setIsActive] = useState(false);
  const dropdownRef = useRef<any>(null);

  const sortTabs = tab === "duels" ? duelsSortTabs : arenaSortTabs;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSortSelect = (key: string) => {
    setSortBy(key as ArenaSortType);
    setIsActive(false);
  };

  return (
    <FilterButton
      $newSort
      ref={dropdownRef}
      onClick={() => setIsActive(!isActive)}
      data-testid="sort-btn"
    >
      <div className="sort-trigger">
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.0625 2.46875L9.03125 0.5M9.03125 0.5L11 2.46875M9.03125 0.5L9.03125 11M4.4375 9.03125L2.46875 11M2.46875 11L0.5 9.03125M2.46875 11L2.46875 0.5"
            stroke="#728094"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          style={{
            fontSize: 12,
          }}
        >
          {sortTabs.find((item) => item.key === sortBy)?.name || "Sort"}
        </span>
      </div>
      <SortDropdown
        $isVisible={isActive}
        className={`sort-dropdown ${tab === "duels" ? "duels-dropdown" : ""}`}
      >
        {sortTabs.map((item) => (
          <SortOption
            key={item.key}
            className={`${sortBy === item.key ? "selected" : ""} ${
              item.key === "resolved" || item.key === "ends_soon"
                ? "resolved"
                : ""
            } ${item.key === "my_predictions" || item.key === "my_duels" ? "my-predictions" : ""}`}
            onClick={() => handleSortSelect(item.key)}
          >
            <div className="option-content">
              {item.key === "star" && (
                <div className="icon-wrapper">
                  <Star size={16} color="#738094" />
                </div>
              )}
              <span className="option-name">{item.name}</span>
            </div>
            {sortBy === item.key && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M13.3334 4L6.00002 11.3333L2.66669 8"
                  stroke="var(--main-green)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </SortOption>
        ))}
      </SortDropdown>
    </FilterButton>
  );
};

export default ArenaSort;
