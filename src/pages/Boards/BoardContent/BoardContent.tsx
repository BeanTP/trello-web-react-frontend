import Box from "@mui/material/Box";
import ListColumns from "./ListColumns/ListColumns";
import Column from "./ListColumns/Column/Column";
import TrelloCard from "./ListColumns/Column/ListCards/TrelloCard/TrelloCard";
import type { Board, CardTrello } from "~/types/types";
import { mapOrder } from "~/utils/sort";
import { 
  DndContext, 
  type DragEndEvent,
  type DragStartEvent,
  // PointerSensor,
  MouseSensor,
  TouchSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
  DragOverlay,
  type DropAnimation,
  defaultDropAnimationSideEffects,
  type DragOverEvent
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { ColumnTrello } from "~/types/types";
import { useEffect, useState } from "react";
import { cloneDeep } from "lodash";

const ACTIVE_DRAG_ITEM_TYPE = {
  COLUMN: "ACTIVE_DRAG_ITEM_TYPE_COLUMN",
  CARD: "ACTIVE_DRAG_ITEM_TYPE_CARD"
};

function BoardContent({ board }: { board?: Board }) {
  // https://docs.dndkit.com/api-documentation/sensors
  // Nếu dùng PointerSensor mặc định thì phải kết hợp thuộc tính CSS touch-action: none ở những phần tử kéo thả (nhưng sẽ còn bug)
  // const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 10 } });
  
  // Yêu cầu con trỏ chuột di chuyển 10px thì mới kích hoạt event drag-drop, fix trường hợp click bị gọi event
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 10 },
  });

  // Nhấn giữ 250ms và dung sai của cảm ứng 500 thì mới kích hoạt event
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 500 },
  });


  // const sensors = useSensors(pointerSensor);
  // Ưu tiên sử dụng kết hợp 2 loại sensors là mouse và touch để có trải nghiệm trên mobile tốt nhất, tránh bị bug
  const sensors = useSensors(mouseSensor, touchSensor);
  const [orderedColumns, setOrderedColumns] = useState<ColumnTrello[]>([]);

  // Cùng một thời điểm chỉ có một phần tử đang được kéo (column hoặc card)
  const [activeDragItemId, setActiveDragItemId] = useState<UniqueIdentifier | null>(null);
  const [activeDragItemType, setActiveDragItemType] = useState<string | null>(null);
  const [activeDragItemData, setActiveDragItemData] = useState<ColumnTrello | CardTrello | null>(null);


  useEffect(() => {
    setOrderedColumns(mapOrder(board?.columns, board?.columnOrderIds, "_id"));
  }, [board]);

  // Tìm column chứa cardId đang được truyền vào
  const findColumnByCardId = (cardId: string) => {
    return orderedColumns.find(col => col?.cards?.map(card => card?._id)?.includes(cardId))
  }

  // Trigger khi bắt đầu sự kiện kéo thả
  const handleDragStart = (event: DragStartEvent) => {
    // console.log("handleDragStart: ", event);
    setActiveDragItemId(event?.active?.id);
    setActiveDragItemType(event?.active?.data?.current?.columnId ? ACTIVE_DRAG_ITEM_TYPE.CARD : ACTIVE_DRAG_ITEM_TYPE.COLUMN);
    setActiveDragItemData(event?.active?.data?.current as ColumnTrello | CardTrello | null);
  }

  // Trigger khi đang kéo
  const handleDragOver = (event: DragOverEvent) => {
    // Không xử lý gì thêm khi đang keo Column
    if(activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) return;

    // Còn nếu kéo card thì xử lý thêm để có thể thực hiện tính năng kéo thả card qua lại giữa các column
    console.log("hanldeDragOver: ", event);
    const {active, over} = event;

    // Kiểm tra trường hợp kéo linh tinh
    if(!active || !over) return;

    // activeDraggingCard: là cái card đang được kéo
    const { id: activeDraggingCardId, data: {current: activeDraggingCardData} } = active;
    // overCard là cái card đang tương tác trên hoặc dưới so với cái card được kéo ở trên
    const { id: overCardId } = over;

    // Tìm 2 cái column theo cardId
    const activeColumn = findColumnByCardId(activeDraggingCardId as string);
    const overColumn = findColumnByCardId(overCardId as string);

    // Nếu không tồn tại 1 trong 2 column thì không làm gì hết, tránh trường hợp crash web
    if(!activeColumn || !overColumn) return;

    // Xử lý logic ở đây chỉ khi kéo card qua 2 column khác nhau, còn nếu kéo card trong chính column ban đầu của nó thì không làm gì
    // Vì đây đang là đoạn xử lý lúc kéo (handleDragOver), còn xử lý lúc kéo xong xuôi thì nó lại là vấn đề khác ở handleDragEnd
    if(activeColumn._id !== overColumn._id){
      setOrderedColumns(prevColumns => {
        // Tìm vị trí (index) của overCard trong column đích
        const overCardIndex = overColumn?.cards?.findIndex(card => card._id === overCardId);

        // Logic tính toán "cardIndex mới" (trên hoặc dưới của overCard) lấy chuẩn ra từ code của thư viện của dnd-kit
        let newCardIndex: number;
        const isBelowOverItem = active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;
        const modifier = isBelowOverItem ? 1 : 0;
        // eslint-disable-next-line prefer-const
        newCardIndex = overCardIndex >= 0 ? overCardIndex + modifier : overColumn?.cards?.length + 1;
        
        // Clone array OrderedColumnsState cũ ra một cái mới để xử lý data rồi return - cập nhật lại OrderedColumnsState mới
        const nextColumns = cloneDeep(prevColumns);
        const nextActiveColumn = nextColumns.find(column => column._id === activeColumn._id);
        const nextOverColumn = nextColumns.find(column => column._id === overColumn._id);

        // Column cũ
        if(nextActiveColumn){
          // Xóa card ở cái column active (cũng có thể hiểu là column cũ, cái lúc mà kéo card ra khỏi nó để sang column khác)
          nextActiveColumn.cards = nextActiveColumn.cards.filter(card => card._id !== activeDraggingCardId);

          // Cập nhật lại mảng cardOrderIds cho chuẩn hóa dữ liệu
          nextActiveColumn.cardOrderIds = nextActiveColumn.cards.map(card => card._id);
        }

        // Column mới
        if(nextOverColumn){
          // Kiểm tra xem card đang kéo có tồn tại ở overColumn chưa, nếu có thì cần xóa nó trước
          nextOverColumn.cards = nextOverColumn.cards.filter(
            (card) => card._id !== activeDraggingCardId
          );

          // Tiếp theo thêm cái card đang kéo vào overColumn theo vị trí index mới
          nextOverColumn.cards = nextOverColumn.cards.toSpliced(newCardIndex, 0, activeDraggingCardData as CardTrello);

          // Cập nhật lại mảng cardOrderIds cho chuẩn dữ liệu
          nextOverColumn.cardOrderIds = nextOverColumn.cards.map(
            (card) => card._id
          );
        }

        return nextColumns;
      })
    }
  }

  // Trigger khi kết thúc sự kiện kéo thả
  const handleDragEnd = (event: DragEndEvent) => {
    // console.log("handleDragEnd: ", event); 
    if(activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD){
      return;
    }
    const { active, over } = event;

    // Nếu kéo thả column vào vị trí không tồn tại trong mảng thì return (kéo thả linh tinh)
    if (!active || !over) return;

    // Nếu column hiện tại được kéo tới vị trí khác với vị trí ban đầu
    if (active.id !== over.id) {
      // Lấy vị trí cũ (từ thằng active)
      const oldIndex = orderedColumns.findIndex((c) => c._id === active.id);
      // Lấy vị trí cũ (từ thằng active)
      const newIndex = orderedColumns.findIndex((c) => c._id === over.id);

      const dndOderedColumns = arrayMove(orderedColumns, oldIndex, newIndex);
      // const dndOderedColumnsIds = dndOderedColumns.map(c => c._id);

      // Cập nhật lại state columns ban đầu sau khi thực hiện chức năng kéo thả
      setOrderedColumns(dndOderedColumns);
    }

    setActiveDragItemId(null);
    setActiveDragItemType(null);
    setActiveDragItemData(null);
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.5",
        },
      },
    }),
  };

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd} 
    >
      <Box
        sx={{
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "#34495e" : "#1976d2",
          width: "100%",
          height: (theme) => theme.trello.boardContentHeight,
          p: "5px 0",
        }}
      >
        <ListColumns columns={orderedColumns} />
        <DragOverlay dropAnimation={dropAnimation}>
          {!activeDragItemType && null}
          {(activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) && <Column column={activeDragItemData as ColumnTrello}/>}
          {(activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) && <TrelloCard card={activeDragItemData as CardTrello}/>}
          {/* {activeDragItemType ? 
          (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN ? (<Column column={activeDragItemData as ColumnTrello} />) : 
          (<TrelloCard card={activeDragItemData as CardTrello} />)) : null} */}
        </DragOverlay>
      </Box>
    </DndContext>
  );
}

export default BoardContent;
