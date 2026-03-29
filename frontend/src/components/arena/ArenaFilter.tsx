'use client';

import React, { FC, useState, useEffect } from "react";
import styled from "styled-components";
import { DropdownRow, FilterButton } from "@/global/Filter/styles";
import {
  Buttons,
  OtcDropdown,
  OtcDropdownWrapper,
  OtcFilterWrapper,
  ResetWrapper,
  OtcBottom,
} from "@/global/Filter/otc-styles";
import OtcCheckboxRow from "@/global/Filter/otc_checkbox_row";
import OtcRangeRow from "@/global/Filter/otc-range_row";
import Button from "@/global/common/Button";
import { RotateCcw } from "lucide-react";
import MainModal from "@/global/common/MainModal";

const arenaFilters = [
  {
    type: "checkbox",
    title: "Type",
    items: [
      "TGE / IDO / Launch",
      "Yes/No",
      "Multi-level",
      "Conditional (IF→THEN)",
    ],
    key: "type",
  },
  {
    type: "checkbox",
    title: "Status",
    items: ["Live", "Active", "Pending", "Resolved"],
    key: "status",
  },
  {
    type: "checkbox",
    title: "Risk",
    items: ["Low", "Medium", "High"],
    key: "risk",
  },
  {
    type: "checkbox",
    title: "Hype",
    items: ["Low", "Medium", "High"],
    key: "hype",
  },
];

const duelsFilters = [
  {
    type: "checkbox",
    title: "Status",
    items: ["Open", "In Progress", "Settled", "Expired"],
    key: "status",
  },
  {
    type: "checkbox",
    title: "Time Left",
    items: ["Ends Soon", "Today", "This Week"],
    key: "timeLeft",
  },
];

const initialArenaFilterData = {
  type: ["TGE / IDO / Launch"],
  status: ["Live"],
  risk: ["Low"],
  hype: ["Low"],
};

const initialDuelsFilterData = {
  status: ["Open"],
  timeLeft: ["Ends Soon"],
};

interface Props {
  filterDataInitial?: any;
  onSave: (filterData: any) => void;
  onReset: () => void;
  tab?: "arena" | "duels" | "leagues";
}

const ArenaFilter: FC<Props> = ({
  filterDataInitial,
  onSave,
  onReset,
  tab = "arena",
}) => {
  const [active, setActive] = useState(false);

  const defaultFilters = tab === "duels" ? duelsFilters : arenaFilters;
  const initialFilterData =
    tab === "duels" ? initialDuelsFilterData : initialArenaFilterData;

  const [filterData, setFilterData] = useState<any>(initialFilterData);

  useEffect(() => {
    const newInitialData =
      tab === "duels" ? initialDuelsFilterData : initialArenaFilterData;
    setFilterData(newInitialData);
  }, [tab]);

  const inputsHandler = (value: any, key: string): void => {
    const updatedFilterData = { ...filterData, [key]: value };
    setFilterData(updatedFilterData);
  };

  const handleResetFilters = () => {
    const resetData =
      tab === "duels" ? initialDuelsFilterData : initialArenaFilterData;
    setFilterData(resetData);
    onReset();
    setActive(false);
  };

  const renderFilterItem = (item: any) => {
    switch (item.type) {
      case "checkbox":
        return (
          <OtcCheckboxRow
            data={filterData[item.key]}
            title={item.title}
            items={item.items}
            onChange={(value) => inputsHandler(value, item.key)}
            className={`otc-checkbox ${item.key}`}
            showInfoIcon={false}
          />
        );
      case "range":
        return (
          <OtcRangeRow
            data={filterData[item.key]}
            title={item.title}
            step={item.step}
            range={item.range}
            onChange={(values) => inputsHandler(values, item.key)}
            showInfoIcon={false}
          />
        );
      default:
        return null;
    }
  };

  return (
    <OtcFilterWrapper>
      <FilterButton $newSort onClick={() => setActive((state) => !state)} data-testid="filter-btn">
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.37099 8.70312V5.96875L11.1571 2.18269C11.3674 1.97236 11.4375 1.76202 11.4375 1.48157C11.4375 0.920671 11.0168 0.5 10.4559 0.5H1.48157C0.920681 0.5 0.5 0.920671 0.5 1.48157C0.5 1.76202 0.570119 1.97236 0.780457 2.18269L4.56651 5.96875V11.4375L7.37099 8.70312Z"
            stroke="#728094"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          style={{
            fontSize: 12,
          }}
        >
          Filter
        </span>
      </FilterButton>
      <MainModal
        isVisible={active}
        className="filter-modal small"
        title="Filter"
        variant="deal"
        onClose={() => setActive(false)}
      >
        <OtcDropdownWrapper
          $variant="small"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {tab === "arena" ? (
            <>
              {/* Type */}
              <DropdownRow
                style={{
                  padding: "20px",
                  background: "#F5FBFD",
                  borderRadius: "6px",
                }}
              >
                {renderFilterItem(defaultFilters[0])}
              </DropdownRow>

              {/* Status */}
              <DropdownRow
                style={{
                  padding: "20px",
                  background: "#F5FBFD",
                  borderRadius: "6px",
                }}
              >
                {renderFilterItem(defaultFilters[1])}
              </DropdownRow>

              {/* Risk + Hype in one row (two columns) */}
              <DropdownRow
                style={{
                  padding: "20px",
                  background: "#F5FBFD",
                  borderRadius: "6px",
                }}
              >
                <TwoColumns>
                  <OneColumn>{renderFilterItem(defaultFilters[2])}</OneColumn>
                  <OneColumn>{renderFilterItem(defaultFilters[3])}</OneColumn>
                </TwoColumns>
              </DropdownRow>
            </>
          ) : (
            <>
              {/* Status */}
              <DropdownRow
                style={{
                  padding: "20px",
                  background: "#F5FBFD",
                  borderRadius: "6px",
                }}
              >
                {renderFilterItem(defaultFilters[0])}
              </DropdownRow>

              {/* Time Left */}
              <DropdownRow
                style={{
                  padding: "20px",
                  background: "#F5FBFD",
                  borderRadius: "6px",
                }}
              >
                {renderFilterItem(defaultFilters[1])}
              </DropdownRow>
            </>
          )}
        </OtcDropdownWrapper>

        <OtcBottom $variant="small">
          <Buttons>
            <Button
              onClick={() => {
                setActive(false);
              }}
              className="red-btn"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onSave(filterData);
                setActive(false);
              }}
              variant="primary"
            >
              Apply
            </Button>
          </Buttons>
          <ResetWrapper $variant="small">
            <Button onClick={handleResetFilters} className="reset-btn small">
              <RotateCcw size={16} />
              Reset
            </Button>
          </ResetWrapper>
        </OtcBottom>
      </MainModal>
    </OtcFilterWrapper>
  );
};

export default ArenaFilter;

const TwoColumns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const OneColumn = styled.div`
  .otc-checkbox.checkboxes {
    padding-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
`;
