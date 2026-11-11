import React, { useState, useEffect } from 'react'
import { Button, Modal, Space } from 'antd'
import {
  CaretDownOutlined,
  CaretRightOutlined,
  MinusSquareOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'

const TreeNode = ({
  node,
  toggleNode,
  deleteMethod,
  getCatalogProperty,
  onOpenModifyModal,
  newCatalogRow,
  setCatalogRow,
  onOpenAddModal,
  catalogId,
  setCatalogId,
}: any) => {
  function click(e: React.MouseEvent<HTMLDivElement>) {
    const dataId = e.currentTarget.getAttribute('data-id')
    setCatalogId(dataId)
  }

  return (
    <div>
      <div className="group mx-2 my-1 flex cursor-pointer items-center rounded p-1 leading-8">
        <div className="shrink-0 hover:scale-110" onClick={() => toggleNode(node.catalog_id)}>
          {node.child_count != 0 ? (
            node.isOpen ? (
              <CaretDownOutlined className="text-[18px] text-[#627fb2]" />
            ) : (
              <CaretRightOutlined className="text-[18px] text-[#627fb2]" />
            )
          ) : (
            <MinusSquareOutlined className="text-[10px] text-[#627fb2]" />
          )}
        </div>

        <div
          style={{ flex: 1, marginLeft: '5px' }}
          className={`rounded px-2 transition-all ${
            catalogId == node.catalog_id
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-200 hover:text-[#474554]'
          }`}
          data-id={node.catalog_id}
          onClick={click}
        >
          <div className="ml-2 flex flex-wrap items-center justify-between">
            <span>{node.catalog_name}</span>
            <span className="hidden group-hover:inline-flex">
              <Space size={0} onClick={(e) => e.stopPropagation()}>
                <Button
                  type="link"
                  size="small"
                  icon={<PlusOutlined />}
                  title="新增"
                  onClick={() => {
                    setCatalogRow({
                      ...newCatalogRow,
                      parent_id: node.catalog_id,
                    })
                    onOpenAddModal()
                  }}
                />
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  title="编辑"
                  onClick={() => {
                    onOpenModifyModal()
                    getCatalogProperty(node.catalog_id)
                  }}
                />
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  title="删除"
                  onClick={() => {
                    Modal.confirm({
                      title: '确定删除？',
                      onOk: () => deleteMethod(node.catalog_id, ''),
                    })
                  }}
                />
              </Space>
            </span>
          </div>
        </div>
      </div>

      {node.isOpen && node.children && (
        <div className="ml-6">
          {node.children.map((item: any) => (
            <TreeNode
              node={item}
              key={item.catalog_id}
              toggleNode={toggleNode}
              deleteMethod={deleteMethod}
              getCatalogProperty={getCatalogProperty}
              onOpenModifyModal={onOpenModifyModal}
              newCatalogRow={newCatalogRow}
              setCatalogRow={setCatalogRow}
              onOpenAddModal={onOpenAddModal}
              catalogId={catalogId}
              setCatalogId={setCatalogId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Trees(props: any) {
  const [list, setList] = useState<any[]>([])

  useEffect(() => {
    setList(props.catalogList)
  }, [props.catalogList])

  const toggleNode = (id: any) => {
    const toggle = (nodes: any) => {
      return nodes.map((node: any) => {
        if (node.catalog_id === id) {
          return { ...node, isOpen: !node.isOpen }
        } else if (node.children) {
          return { ...node, children: toggle(node.children) }
        }
        return node
      })
    }
    setList(toggle(list))
  }

  return (
    <div className="w-full">
      {list.map((item, index) => (
        <div key={index}>
          <TreeNode
            node={item}
            toggleNode={toggleNode}
            newCatalogRow={props.newCatalogRow}
            setCatalogRow={props.setCatalogRow}
            onOpenAddModal={props.onOpenAddModal}
            deleteMethod={props.deleteCatalog}
            getCatalogProperty={props.getCatalogProperty}
            onOpenModifyModal={props.onOpenModifyModal}
            catalogId={props.catalogId}
            setCatalogId={props.setCatalogId}
          />
        </div>
      ))}
    </div>
  )
}
