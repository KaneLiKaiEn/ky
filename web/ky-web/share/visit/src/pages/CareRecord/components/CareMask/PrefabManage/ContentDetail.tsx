import React, { useEffect } from 'react'
import { Button, Input, message } from 'antd'
import { getCarePrefabContentAPI, saveCarePrefabContentAPI } from '../../../api'

export default function ContentDetail(props: any) {
  const { prefabId, setPrefabId, contentDetail, setContentDetail, catalogId, prefabInput } = props

  function getCareContent(prefab_id: any) {
    getCarePrefabContentAPI({
      prefab_id: Number(prefab_id),
      kb_code: '',
    }).then((res: any) => {
      if (res.code == 0) {
        setContentDetail(res.care_content)
      } else {
        setContentDetail('')
      }
    })
  }

  function saveCareContent() {
    saveCarePrefabContentAPI({
      prefab_id: Number(prefabId),
      care_content: contentDetail,
    }).then((res) => {
      if (res.code == 0) {
        message.success('保存成功')
      } else {
        message.error(res.message)
      }
    })
  }

  useEffect(() => {
    if (prefabId) {
      getCareContent(prefabId)
    }
  }, [prefabId])

  useEffect(() => {
    setPrefabId('')
  }, [catalogId])

  if (!prefabId) {
    return null
  }

  return (
    <div className="p-1">
      <Input.TextArea
        placeholder="模板内容"
        style={{ height: 300 }}
        value={contentDetail}
        onChange={(e) => setContentDetail(e.target.value)}
      />
      <hr className="my-2 border-(--app-theme-border)" />
      <div className="flex items-center gap-2">
        <Button
          size="small"
          onClick={() => {
            setContentDetail('')
            setPrefabId('')
          }}
        >
          取消
        </Button>
        <Button size="small" type="primary" onClick={saveCareContent}>
          保存
        </Button>
        {prefabInput ? (
          <span className="ms-2 font-bold">
            创建人：{prefabInput.replace('张三丰', '管理员')}
          </span>
        ) : null}
      </div>
    </div>
  )
}
