/** 对齐 WikiInfoResponseDTO */
export interface WikiInfo {
  id: number
  projectId: number
  projectName: string | null
  startPage: string | null
  status: number | null
}

export interface WikiUpdatePayload {
  startPage?: string
}

/** 对齐 WikiPageListItemResponseDTO */
export interface WikiPageListItem {
  id: number
  title: string
  parentId: number | null
  isProtected: boolean | null
  createdOn: string | null
  updatedOn: string | null
  version: number | null
  authorName: string | null
}

/** 对齐 WikiPageDetailResponseDTO */
export interface WikiPageDetail {
  id: number
  wikiId: number
  projectId: number
  title: string
  parentId: number | null
  isProtected: boolean | null
  createdOn: string | null
  text: string | null
  comments: string | null
  version: number | null
  updatedOn: string | null
  authorId: number | null
  authorName: string | null
}

export interface WikiPageCreatePayload {
  title: string
  parentId?: number | null
  isProtected?: boolean
  text?: string
  comments?: string
}
