//定义接口返回类型
interface Node {
  catalog_code: string
  catalog_id: number
  catalog_level: number
  catalog_name: string
  catalog_type: string
  child_count: number
  dept_id: number
  org_id: number
  parent_id: number
  sort_no: string
  children?: Node[]
}

// 构造树形结构
function constructTree(data: Node[], parentId: number = 0): Node[] {
  const tree: Node[] = []

  for (const node of data) {
    if (node.parent_id === parentId) {
      const children = constructTree(data, node.catalog_id)
      if (children.length) {
        node.children = children
      }
      tree.push(node)
    }
  }

  return tree
}

// 根据树形结构生成具有首行缩进的下拉框
function convertTreeToDropdown(tree: any, level = 0) {
  const dropdown = []

  for (const node of tree) {
    const { catalog_id, catalog_name, catalog_type, children } = node
    const indentation = '-'.repeat(level) // 每层缩进2个字符

    dropdown.push({
      catalog_id: catalog_id,
      catalog_name: indentation + catalog_name,
      catalog_type: catalog_type,
    })

    if (children) {
      const childDropdown: any = convertTreeToDropdown(children, level + 1)
      dropdown.push(...childDropdown)
    }
  }

  return dropdown
}

export { constructTree, convertTreeToDropdown }
