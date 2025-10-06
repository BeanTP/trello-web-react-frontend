import Box from "@mui/material/Box";
import ListColumns from "./ListColumns/ListColumns";
import type { Board } from "~/types/types";
import { mapOrder } from "~/utils/sort";
import { 
  DndContext, 
  type DragEndEvent,
  // PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { ColumnTrello } from "~/types/types";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    setOrderedColumns(mapOrder(board?.columns, board?.columnOrderIds, "_id"));
  }, [board]);

  const handleDragEnd = (event: DragEndEvent) => {
    console.log("handleDragEnd: ", event);
    const { active, over } = event;

    // Nếu kéo thả column vào vị trí không tồn tại trong mảng thì return (kéo thả linh tinh)
    if (!over) return;

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
  };

  return (
    <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
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
      </Box>
    </DndContext>
  );
}

export default BoardContent;
