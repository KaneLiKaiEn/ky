import { useEffect, useState } from "react";
import { Empty, List, Spin } from "antd";
import {
  getCatalogListAPI,
  getCarePrefabListAPI,
  getCarePrefabContent2API,
} from "../../api";

interface CarePrefabTemplateProps {
  onSelect: (careContent: string) => void;
  /** 变化时重新拉取模板列表 */
  refreshKey?: number;
}

export default function CarePrefabTemplate({
  onSelect,
  refreshKey = 0,
}: CarePrefabTemplateProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [prefabList, setPrefabList] = useState<
    {
      catalog_id: number;
      catalog_name: string;
      prefab_id: number;
      prefab_name: string;
      care_content: string;
    }[]
  >([]);

  function getCatalogType() {
    setIsLoading(true);
    getCatalogListAPI({
      parent_id: 0,
      catalog_type: "PREFAB.CARE.CONTENT",
      include_invalid: false,
      include_descendant: true,
      include_self: false,
    }).then((sysRes) => {
      if (sysRes.catalog_list?.length > 0) {
        const cataLog_list: { catalog_id: number; catalog_name: string }[] = [];
        const save_prefab_list: {
          catalog_id: number;
          catalog_name: string;
          prefab_id: number;
          prefab_name: string;
          care_content: string;
        }[] = [];

        sysRes.catalog_list?.forEach((catalog: any) => {
          cataLog_list.push({
            catalog_id: Number(catalog.catalog_id),
            catalog_name: catalog.catalog_name,
          });
        });

        getCarePrefabListAPI({
          catalog_id: 0,
          include_org: true,
          include_dept: true,
        }).then((careRes: any) => {
          const catalogIdOrderMap = new Map<number, number>();
          cataLog_list.forEach((item, index) => {
            catalogIdOrderMap.set(item.catalog_id, index);
          });

          if (careRes.row_list?.length > 0) {
            const sortedRowList = [...careRes.row_list].sort(
              (a: any, b: any) => {
                const aOrder = catalogIdOrderMap.get(a.catalog_id) ?? Infinity;
                const bOrder = catalogIdOrderMap.get(b.catalog_id) ?? Infinity;
                return aOrder - bOrder;
              },
            );

            const prefab_promises: number[] = [];

            sortedRowList?.forEach((item: any) => {
              const current_catalog_id = item.catalog_id;
              const catalog_item = cataLog_list?.find(
                (i) => i.catalog_id == current_catalog_id,
              );

              if (catalog_item) {
                save_prefab_list.push({
                  catalog_id: Number(catalog_item.catalog_id),
                  catalog_name: catalog_item.catalog_name,
                  prefab_id: Number(item.prefab_id),
                  prefab_name: item.prefab_name,
                  care_content: "",
                });

                prefab_promises.push(Number(item.prefab_id));
              }
            });

            getCarePrefabContent2API({
              prefab_id_list: prefab_promises,
            }).then((res: any) => {
              if (res.row_list.length > 0) {
                res.row_list?.forEach((item: any) => {
                  const content_item = save_prefab_list?.find(
                    (i) => i.prefab_id == item.prefab_id,
                  );
                  if (content_item)
                    content_item.care_content = item.care_content;
                });
              }

              setPrefabList(
                save_prefab_list.filter((i) => i.care_content != ""),
              );
              setIsLoading(false);
            });
          } else {
            setIsLoading(false);
          }
        });
      } else {
        setIsLoading(false);
      }
    });
  }

  useEffect(() => {
    getCatalogType();
  }, [refreshKey]);

  return (
    <div className="flex flex-col">
      <div className="rounded border border-(--app-theme-border)">
        {isLoading ? (
          <div className="flex min-h-24 items-center justify-center py-8">
            <Spin size="small" tip="加载中......" />
          </div>
        ) : prefabList?.length > 0 ? (
          <List
            size="small"
            split
            dataSource={prefabList}
            renderItem={(item) => (
              <List.Item
                className="cursor-pointer px-2! py-1!"
                title={item.care_content}
                onDoubleClick={() => onSelect(item.care_content)}
              >
                {item.catalog_name}/{item.prefab_name}
              </List.Item>
            )}
          />
        ) : (
          <div className="flex min-h-24 items-center justify-center">
            <Empty description="暂无模板" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        )}
      </div>
      <div className="mt-1 text-xs text-gray-400">双击模板追加到内容</div>
    </div>
  );
}
