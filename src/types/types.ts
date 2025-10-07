// types.ts
export type ID = string;

export interface CardTrello {
  _id: ID;
  boardId: ID;
  columnId: ID;
  title: string;
  description: string | null;
  cover: string | null;
  memberIds: ID[];
  comments: string[];
  attachments: string[];
}

export interface ColumnTrello {
  _id: ID;
  boardId: ID;
  title: string;
  cardOrderIds: ID[];
  cards: CardTrello[];
}

export interface Board {
  _id: ID;
  title: string;
  description: string;
  type: "public" | "private";
  ownerIds: ID[];
  memberIds: ID[];
  columnOrderIds: ID[];
  columns: ColumnTrello[];
}