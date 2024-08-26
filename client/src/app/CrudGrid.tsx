"use client";

import { ReactNode, useEffect, useState } from "react";
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridRowModes,
  GridRowModesModel,
  GridSlots,
  GridToolbarContainer,
} from "@mui/x-data-grid";
import { TodoItem } from "@/models/dtos";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addTodo, deleteTodo, getTodos, updateTodo } from "@/models/queryFns";
import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

interface InternalTodoItem extends TodoItem {
  syncStatus: SyncStatus;
}

interface EditToolbarProps {
  rows: InternalTodoItem[];
  setRows: (
    newRows: (oldRows: InternalTodoItem[]) => InternalTodoItem[],
  ) => void;
  setRowModesModel: (
    newModel: (oldModel: GridRowModesModel) => GridRowModesModel,
  ) => void;
}

enum SyncStatus {
  Synced = "Synced",
  PendingAdd = "Adding",
  PendingUpdate = "Updating",
  PendingDelete = "Deleting"
}

const EditToolbar: (props: EditToolbarProps) => ReactNode = ({
  rows,
  setRows,
  setRowModesModel,
}) => {
  const handleClick: () => void = () => {
    const oldIds = rows.map(({ id }) => id);
    const newId = oldIds.length === 0 ? 1 : Math.max(...oldIds) + 1;
    setRows((oldRows) => [
      ...oldRows,
      {
        id: newId,
        name: "",
        isComplete: false,
        syncStatus: SyncStatus.PendingAdd,
      },
    ]);
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [newId]: { mode: GridRowModes.Edit, fieldToFocus: "name" },
    }));
  };

  return (
    <GridToolbarContainer>
      <Button startIcon={<AddIcon />} onClick={handleClick}>
        Add Todo Item
      </Button>
    </GridToolbarContainer>
  );
};

const CrudGrid: () => ReactNode = () => {
  const [rows, setRows] = useState<InternalTodoItem[] | null>(null);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

  const handleRowModesModelChange: (
    newRowModesModel: GridRowModesModel,
  ) => void = (newRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  const queryClient = useQueryClient();
  const getAllQueryResult = useQuery({
    queryKey: ["todos"],
    queryFn: getTodos,
  });
  const addMutation = useMutation({
    mutationFn: addTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
  const updateMutation = useMutation({
    mutationFn: updateTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  useEffect(() => {
    if (getAllQueryResult.data) {
      const rows = getAllQueryResult.data;
      const internalRows: InternalTodoItem[] = rows.map((row) => ({
        ...row,
        syncStatus: SyncStatus.Synced,
      }));
      setRows(internalRows);
    }
  }, [getAllQueryResult.data, getAllQueryResult.dataUpdatedAt]);

  const handleEditClick: (id: InternalTodoItem) => void = (row) => {
    if (!rows) {
      return;
    }
    
    const id = row.id
    row.syncStatus = SyncStatus.PendingUpdate
    setRows(rows.map(currRow => currRow.id === row.id ? row : currRow));
    
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveClick: (id: number) => void = (id) => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  };

  const handleDeleteClick: (row: InternalTodoItem) => void = (row) => {
    if (!rows) {
      return;
    }
    
    row.syncStatus = SyncStatus.PendingDelete
    setRows(rows.map(currRow => currRow.id === row.id ? row : currRow));
    deleteMutation.mutate(row.id);
  };

  const handleCancelClick: (row: InternalTodoItem) => void = (row) => {
    if (!rows) {
      return;
    }

    const id = row.id;

    if (row.syncStatus === SyncStatus.PendingAdd) {
      setRows(rows.filter((row) => row.id !== id));
      return;
    }
    
    // It is possible for the previous sync state to be overwritten this way. Instead of trying to work around this
    // issue in the current design, a better approach for the long term would be to simply forbid all changes while a
    // network request is pending.
    row.syncStatus = SyncStatus.Synced
    setRows(rows.map(currRow => currRow.id === row.id ? row : currRow));
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });
  };

  const processRowUpdate: (newRow: InternalTodoItem) => InternalTodoItem = (
    newRow,
  ) => {
    if (!rows) {
      return newRow;
    }

    if (newRow.syncStatus === SyncStatus.PendingAdd) {
      addMutation.mutate({ name: newRow.name, isComplete: newRow.isComplete });
    } else {
      updateMutation.mutate({
        id: newRow.id,
        name: newRow.name,
        isComplete: newRow.isComplete,
      });
    }
    
    setRows(rows.map((row) => (row.id === newRow.id ? newRow : row)));
    return newRow;
  };

  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "ID",
      type: "number",
      width: 100,
      editable: false,
    },
    {
      field: "name",
      headerName: "Name",
      flex: 9,
      editable: true,
    },
    {
      field: "isComplete",
      headerName: "Complete",
      type: "boolean",
      width: 100,
      editable: true,
    },
    {
      field: "syncStatus",
      headerName: "Sync Status",
      type: "string",
      width: 100,
      editable: false,
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 100,
      getActions: (params) => {
        const id = params.id as number;
        const row = params.row as InternalTodoItem;
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        if (row.syncStatus === SyncStatus.PendingDelete) {
          return []
        }
        
        if (isInEditMode) {
          return [
            <GridActionsCellItem
              key="save"
              icon={<SaveIcon />}
              label="Save"
              onClick={() => handleSaveClick(id)}
            />,
            <GridActionsCellItem
              key="cancel"
              icon={<CancelIcon />}
              label="Cancel"
              onClick={() => handleCancelClick(row)}
            />,
          ];
        }

        return [
          <GridActionsCellItem
            key="edit"
            icon={<EditIcon />}
            label="Edit"
            onClick={() => handleEditClick(row)}
          />,
          <GridActionsCellItem
            key="delete"
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => handleDeleteClick(row)}
          />,
        ];
      },
    },
  ];

  return (
    rows && (
      <DataGrid
        columns={columns}
        rows={rows}
        editMode="row"
        rowModesModel={rowModesModel}
        onRowModesModelChange={handleRowModesModelChange}
        processRowUpdate={processRowUpdate}
        slots={{
          toolbar: EditToolbar as GridSlots["toolbar"],
        }}
        slotProps={{
          toolbar: { rows, setRows, setRowModesModel },
        }}
      />
    )
  );
};

export default CrudGrid;
