import React, { useState } from 'react'
import { Button, Empty, Modal, Select, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import Trees from './Trees'
import InputModule from '../../input-module/InputModule'
import {
  newCatalogAPI,
  deleteCatalogAPI,
  getCatalogPropertyAPI,
  saveCatalogPropertyAPI,
} from '../../../api'

export default function PrefabCatalogList(props: any) {
  const {
    isLoading,
    catalogList,
    catalogDropDownList,
    getCatalogType,
    change,
    catalogId,
    setCatalogId,
  } = props

  const orgID = localStorage.getItem('SITE_AUTH_CA_ORG_ID')

  const [newCatalogRow, setCatalogRow] = useState<any>({
    parent_id: 0,
    org_id: orgID,
    dept_id: '',
    group_id: '',
    catalog_type: 'PREFAB.CARE.CONTENT',
    catalog_no: '',
    catalog_name: '',
    catalog_tag: '',
    catalog_note: '',
    icon_system: '',
    icon_name: '',
    sort_no: '',
  })
  const [catalogRowProperty, setCatalogRowProperty] = useState<any>({})
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [modifyModalOpen, setModifyModalOpen] = useState(false)

  function addNewCatalog() {
    if (newCatalogRow.catalog_name.trim() == '') {
      message.warning('名称不能为空')
      return
    }

    newCatalogAPI({
      parent_id: Number(newCatalogRow.parent_id),
      org_id: Number(newCatalogRow.org_id),
      dept_id: Number(newCatalogRow.dept_id),
      group_id: Number(newCatalogRow.group_id),
      catalog_type: newCatalogRow.catalog_type,
      catalog_no: newCatalogRow.catalog_no,
      catalog_name: newCatalogRow.catalog_name,
      catalog_tag: newCatalogRow.catalog_tag,
      catalog_note: newCatalogRow.catalog_note,
      icon_system: newCatalogRow.icon_system,
      icon_name: newCatalogRow.icon_name,
      sort_no: newCatalogRow.sort_no,
    }).then((res) => {
      if (res.code == 0) {
        message.success('添加成功')
      } else {
        message.error(res.message)
      }

      setAddModalOpen(false)
      getCatalogType()
    })
  }

  function deleteCatalog(catalog_id: number, delete_note: string) {
    deleteCatalogAPI({
      catalog_id: Number(catalog_id),
      delete_note: delete_note,
    }).then((res) => {
      if (res.code == 0) {
        message.success('删除成功')
        getCatalogType()
        setCatalogRow({
          parent_id: 0,
          org_id: orgID,
          dept_id: '',
          group_id: '',
          catalog_type: 'PREFAB.CARE.CONTENT',
          catalog_no: '',
          catalog_name: '',
          catalog_tag: '',
          catalog_note: '',
          icon_system: '',
          icon_name: '',
          sort_no: '',
        })
      } else {
        message.error(res.message)
      }
    })
  }

  function getCatalogProperty(catalog_id: any) {
    getCatalogPropertyAPI({
      catalog_id: Number(catalog_id),
    }).then((res) => {
      if (res.code == 0 && Object.keys(res.catalog_property).length > 0) {
        setCatalogRowProperty(res.catalog_property)
      } else {
        setCatalogRowProperty({})
      }
    })
  }

  const getInputValue = (name: string, value: string) => {
    setCatalogRow({ ...newCatalogRow, [name]: value })
  }

  const getModifyInputValue = (name: string, value: string) => {
    setCatalogRowProperty({ ...catalogRowProperty, [name]: value })
  }

  function saveCatalogPropertyHandler() {
    saveCatalogPropertyAPI({
      catalog_id: Number(catalogRowProperty.catalog_id),
      catalog_property: {
        org_id: Number(catalogRowProperty.org_id),
        dept_id: Number(catalogRowProperty.dept_id),
        group_id: Number(catalogRowProperty.group_id),
        unit_id: Number(catalogRowProperty.unit_id),
        user_id: Number(catalogRowProperty.user_id),
        parent_id: Number(catalogRowProperty.parent_id),
        catalog_type: catalogRowProperty.catalog_type,
        catalog_no: catalogRowProperty.catalog_no,
        catalog_code: catalogRowProperty.catalog_code,
        catalog_level: Number(catalogRowProperty.catalog_level),
        catalog_name: catalogRowProperty.catalog_name,
        catalog_tag: catalogRowProperty.catalog_tag,
        catalog_note: catalogRowProperty.catalog_note,
        icon_system: catalogRowProperty.icon_system,
        icon_name: catalogRowProperty.icon_name,
        sort_no: catalogRowProperty.sort_no,
      },
    }).then((res) => {
      if (res.code == 0) {
        message.success('修改成功')
        getCatalogType()
        setModifyModalOpen(false)
      } else {
        message.error(res.message)
      }
    })
  }

  return (
    <div className="h-full">
      <div className="flex items-center gap-2 border-b border-(--app-theme-border) pb-1">
        <div>类别</div>
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          title="新增"
          onClick={() => setAddModalOpen(true)}
        />
      </div>

      <div className="relative h-[50vh] overflow-auto p-0">
        {isLoading ? (
          catalogList.length > 0 ? (
            <Trees
              key={String(change)}
              catalogList={catalogList}
              newCatalogRow={newCatalogRow}
              setCatalogRow={setCatalogRow}
              onOpenAddModal={() => setAddModalOpen(true)}
              deleteCatalog={deleteCatalog}
              getCatalogProperty={getCatalogProperty}
              onOpenModifyModal={() => setModifyModalOpen(true)}
              catalogId={catalogId}
              setCatalogId={setCatalogId}
            />
          ) : (
            <Empty description="请先添加类别" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )
        ) : null}
      </div>

      <Modal
        open={addModalOpen}
        title="新增类别"
        okText="添加"
        onCancel={() => setAddModalOpen(false)}
        onOk={addNewCatalog}
        width={640}
        zIndex={1106}
        destroyOnHidden
      >
        <InputModule
          label="名称*"
          type="text"
          id="catalog_name"
          name="catalog_name"
          value={newCatalogRow.catalog_name}
          getValue={getInputValue}
        />
        <InputModule
          label="备注"
          type="text"
          id="catalog_note"
          name="catalog_note"
          value={newCatalogRow.catalog_note}
          getValue={getInputValue}
        />
        <InputModule
          label="序号"
          type="text"
          id="sort_no"
          name="sort_no"
          value={newCatalogRow.sort_no}
          getValue={getInputValue}
        />
      </Modal>

      <Modal
        open={modifyModalOpen}
        title="修改类别"
        okText="修改"
        onCancel={() => setModifyModalOpen(false)}
        onOk={saveCatalogPropertyHandler}
        width={640}
        zIndex={1106}
        destroyOnHidden
      >
        <InputModule
          label="名称*"
          type="text"
          id="catalog_name"
          name="catalog_name"
          value={catalogRowProperty.catalog_name || ''}
          getValue={getModifyInputValue}
        />
        <InputModule
          label="备注"
          type="text"
          id="catalog_note"
          name="catalog_note"
          value={catalogRowProperty.catalog_note || ''}
          getValue={getModifyInputValue}
        />
        <InputModule
          label="序号"
          type="text"
          id="sort_no"
          name="sort_no"
          value={catalogRowProperty.sort_no || ''}
          getValue={getModifyInputValue}
        />

        <div className="flex items-center gap-2">
          <div className="w-[105px] text-(--app-theme-primary)">修改层级</div>
          <Select
            className="flex-1"
            options={catalogDropDownList.map((item: any) => ({
              value: item.catalog_id,
              label: item.catalog_name,
            }))}
            value={catalogRowProperty.parent_id}
            onChange={(value) => {
              setCatalogRowProperty({
                ...catalogRowProperty,
                parent_id: value,
              })
            }}
          />
        </div>
      </Modal>
    </div>
  )
}
