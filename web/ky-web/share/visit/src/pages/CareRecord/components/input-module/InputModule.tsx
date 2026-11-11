import React from 'react'
import { Form, Input } from 'antd'

interface InputModuleProps {
  label?: string
  type?: string
  id?: string
  name: string
  value?: string
  getValue: (name: string, value: string, index?: number) => void
  index?: number
  margin?: string
  text?: string
  disabled?: boolean
  inputStyle?: React.CSSProperties
  disabledStyle?: React.CSSProperties
}

export default function InputModule(props: InputModuleProps) {
  const changeValue = (value: string) => {
    if (typeof props.index === 'number') {
      props.getValue(props.name, value, props.index)
    } else {
      props.getValue(props.name, value)
    }
  }

  return (
    <Form.Item
      label={props.label}
      className={`mb-2 ${props.margin || ''}`}
      labelCol={{ flex: '105px' }}
      wrapperCol={{ flex: 1 }}
      colon={false}
    >
      <Input
        type={props.type}
        id={props.id}
        name={props.name}
        value={props.value}
        disabled={props.disabled}
        style={props.disabled ? props.disabledStyle : props.inputStyle}
        addonBefore={props.text}
        onChange={(e) => changeValue(e.target.value)}
      />
    </Form.Item>
  )
}
