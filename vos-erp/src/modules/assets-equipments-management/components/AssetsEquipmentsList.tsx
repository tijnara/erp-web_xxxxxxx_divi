"use client";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AssetDetails } from "./AssetDetails";
import { Button } from "@/components/ui/button";
import { AssetForm } from "./AssetForm";
import { Asset } from "@/modules/assets-equipments-management/types";

interface Item {
  id: number;
  item_name: string;
  item_type: number;
  item_classification: number;
}

interface ItemType {
  id: number;
  type_name: string;
}

interface Department {
  department_id: number;
  department_name: string;
}

interface CombinedData {
  id: number;
  itemName: string;
  itemType: string;
  department: string;
  dateAcquired: string;
  depreciation: number;
  asset: Asset;
}

export function AssetsEquipmentsList() {
  const [rawData, setRawData] = useState<{
    assets: Asset[];
    items: Item[];
    itemTypes: ItemType[];
    departments: Department[];
  } | null>(null);
  const [combinedData, setCombinedData] = useState<CombinedData[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [
        itemsRes,
        itemTypesRes,
        departmentsRes,
        assetsRes,
      ] = await Promise.all([
        fetch("http://100.119.3.44:8090/items/items"),
        fetch("http://100.119.3.44:8090/items/item_type"),
        fetch("http://100.119.3.44:8090/items/department"),
        fetch("http://100.119.3.44:8090/items/assets_and_equipment"),
      ]);

      const itemsData = await itemsRes.json();
      const itemTypesData = await itemTypesRes.json();
      const departmentsData = await departmentsRes.json();
      const assetsData = await assetsRes.json();

      setRawData({
        items: itemsData.data,
        itemTypes: itemTypesData.data,
        departments: departmentsData.data,
        assets: assetsData.data,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!rawData) return;

    const { assets, items, itemTypes, departments } = rawData;

    const combined = assets.map((asset) => {
      const item = items.find((i) => i.id === asset.item_id);
      const itemType = itemTypes.find((it) => it.id === item?.item_type);
      const department = departments.find(
        (d) => d.department_id === asset.department
      );

      const annualDepreciation =
        asset.life_span > 0 ? asset.cost_per_item / asset.life_span : 0;
      const dateAcquired = new Date(asset.date_acquired);
      const now = new Date();
      const diffTime = now.getTime() - dateAcquired.getTime();
      const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365);

      const accumulatedDepreciation = annualDepreciation * diffYears;
      const currentValue = asset.cost_per_item - accumulatedDepreciation;

      return {
        id: asset.id,
        itemName: item ? item.item_name : "Unknown",
        itemType: itemType ? itemType.type_name : "Unknown",
        department: department ? department.department_name : "Unknown",
        dateAcquired: new Date(asset.date_acquired).toLocaleDateString(),
        depreciation: currentValue,
        asset: asset,
      };
    });

    setCombinedData(combined);
  }, [rawData]);

  const handleRowClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedAsset(null);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Assets and Equipments</h1>
        <Button onClick={() => setIsFormOpen(true)}>+ Add Asset</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Name</TableHead>
            <TableHead>Item Type</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Date Acquired</TableHead>
            <TableHead>Current Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {combinedData.map((data) => (
            <TableRow key={data.id} onClick={() => handleRowClick(data.asset)} className="cursor-pointer">
              <TableCell>{data.itemName}</TableCell>
              <TableCell>{data.itemType}</TableCell>
              <TableCell>{data.department}</TableCell>
              <TableCell>{data.dateAcquired}</TableCell>
              <TableCell>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "PHP",
                }).format(data.depreciation)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {selectedAsset && (
        <AssetDetails
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
          asset={selectedAsset}
        />
      )}
      <AssetForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {
          setIsFormOpen(false);
          fetchData();
        }}
      />
    </div>
  );
}
