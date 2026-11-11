import React, { useEffect, useState } from "react";
import { Empty, List, Spin, Tag } from "antd";
import type { BillItemType } from "@/types/linkBill";
import {
  retrieveChargeListAPI,
  retrieveDrugListAPI,
  retrieveMaterialListAPI,
} from "@/api/linkBill";

export interface ItemDetailProps {
  itemType: BillItemType;
  retrieveInput: string;
  chooseItem: any;
  setChooseItem: (item: any) => void;
}

export default function ItemDetail({
  itemType,
  retrieveInput,
  chooseItem,
  setChooseItem,
}: ItemDetailProps) {
  const [retrieveList, setRetrieveList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function retrieveItemList(input_value: string, limit = 50) {
    const query = input_value.trim() === "" ? "*" : input_value;

    try {
      setLoading(true);
      let res: any;
      if (itemType === "DRUG") {
        res = await retrieveDrugListAPI({ retrieve_input: query, retrieve_limit: limit });
      } else if (itemType === "MATERIAL") {
        res = await retrieveMaterialListAPI({ retrieve_input: query, retrieve_limit: limit });
      } else if (itemType === "CHARGE") {
        res = await retrieveChargeListAPI({ retrieve_input: query, retrieve_limit: limit });
      } else {
        setRetrieveList([]);
        return;
      }
      setRetrieveList(res?.row_list || []);
    } catch {
      setRetrieveList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (itemType) {
      retrieveItemList(retrieveInput);
    }
  }, [retrieveInput, itemType]);

  return (
    <div style={{ height: "100%", padding: 4 }}>
      {loading ? (
        <div style={{ textAlign: "center", padding: 24 }}>
          <Spin />
        </div>
      ) : retrieveList.length > 0 ? (
        <List
          size="small"
          dataSource={retrieveList}
          renderItem={(item, index) => {
            const spec =
              itemType === "MATERIAL" ? item.item_note || "-" : item.item_spec || "-";
            const selected = chooseItem?.item_id === item.item_id;
            return (
              <List.Item
                onClick={() => setChooseItem(item)}
                style={{
                  cursor: "pointer",
                  background: selected ? "#e6f4ff" : undefined,
                }}
              >
                <List.Item.Meta
                  title={item.item_name}
                  description={
                    <span style={{ fontSize: 12, color: "#666" }}>
                      规格：{spec}　单价：
                      {item.price_latest ? parseFloat(item.price_latest) : "-"}　代码：
                      {item.item_code ? item.item_code : "-"}
                    </span>
                  }
                />
                <Tag>{index + 1}</Tag>
              </List.Item>
            );
          }}
        />
      ) : (
        <Empty description="暂无项目" />
      )}
    </div>
  );
}
