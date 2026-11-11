import React, { useEffect, useState } from 'react'
import { getCatalogListAPI, getCarePrefabPropertyAPI } from '../../../api'
import { constructTree, convertTreeToDropdown } from '../../../utils/construct-tree'
import PrefabCatalogList from './PrefabCatalogList'
import PrefabContentList from './PrefabContentList'
import ContentDetail from './ContentDetail'
import { message } from 'antd'

export default function PrefabManage(props: any) {
  const { prefabId, setPrefabId, contentDetail, setContentDetail, visitId } = props

  const [isLoading, setIsLoading] = useState(false)
  const [change, setChange] = useState(false)
  const [catalogList, setCatalogList] = useState<any[]>([])
  const [catalogDropDownList, setCatalogDropDownList] = useState<any[]>([])
  const [catalogId, setCatalogId] = useState<string>('')
  const [prefabProperty, setPrefabProperty] = useState<any>('')
  const [prefabInput, setPrefabInput] = useState<any>('')

  function getCatalogType() {
    getCatalogListAPI({
      parent_id: 0,
      catalog_type: 'PREFAB.CARE.CONTENT',
      include_invalid: false,
      include_descendant: true,
      include_self: false,
    }).then((res) => {
      if (res.code == 0 && res.catalog_list.length > 0) {
        const buildTrees = res.catalog_list.map((item: any) => ({
          ...item,
          isOpen: false,
        }))

        const trees = constructTree(buildTrees)
        const dropdown = convertTreeToDropdown(trees)

        dropdown.unshift({
          catalog_id: '0',
          catalog_name: '最外层',
        })

        setChange(!change)
        setCatalogList([...trees])
        setCatalogDropDownList(dropdown)
      } else {
        setCatalogList([])
      }

      setIsLoading(true)
    })
  }

  function getPrefabDetail(prefab_id: any) {
    getCarePrefabPropertyAPI({
      prefab_id: Number(prefab_id),
    }).then((res) => {
      if (res.code == 0) {
        setPrefabProperty(res.prefab_property)
      } else {
        setPrefabProperty('')
        message.error(res.message)
      }
    })
  }

  useEffect(() => {
    getCatalogType()
  }, [])

  return (
    <div className="h-full w-full">
      <div className="grid h-full grid-cols-12">
        <div className="col-span-3 h-full border-r border-(--app-theme-border)">
          <PrefabCatalogList
            isLoading={isLoading}
            catalogList={catalogList}
            catalogDropDownList={catalogDropDownList}
            getCatalogType={getCatalogType}
            change={change}
            catalogId={catalogId}
            setCatalogId={setCatalogId}
          />
        </div>

        <div className="col-span-3 h-full border-r border-(--app-theme-border)">
          <PrefabContentList
            visitId={visitId}
            catalogId={catalogId}
            prefabId={prefabId}
            setPrefabId={setPrefabId}
            prefabProperty={prefabProperty}
            getPrefabDetail={getPrefabDetail}
            setPrefabInput={setPrefabInput}
          />
        </div>

        <div className="col-span-6 h-full">
          <ContentDetail
            catalogId={catalogId}
            prefabId={prefabId}
            setPrefabId={setPrefabId}
            contentDetail={contentDetail}
            setContentDetail={setContentDetail}
            prefabInput={prefabInput}
          />
        </div>
      </div>
    </div>
  )
}
