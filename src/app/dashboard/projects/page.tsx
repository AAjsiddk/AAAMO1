'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Loader2, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ProjectTask } from '@/lib/types';


const columns = {
  'todo': 'المهام المطلوبة',
  'in-progress': 'قيد التنفيذ',
  'done': 'مكتمل',
};

type ColumnId = keyof typeof columns;

function TaskCard({ task, index, onDelete }: { task: ProjectTask, index: number, onDelete: (id: string) => void }) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          
          className={`p-3 mb-2 rounded-lg bg-card border ${snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'}`}
        >
          <div className="flex items-start justify-between">
            <p className="flex-grow whitespace-pre-wrap pr-2" {...provided.dragHandleProps}>{task.content}</p>
            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => onDelete(task.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      )}
    </Draggable>
  );
}


function Column({ columnId, title, tasks, onAddTask, onDeleteTask }: { columnId: ColumnId, title: string, tasks: ProjectTask[], onAddTask: (columnId: ColumnId, content: string) => void, onDeleteTask: (id: string) => void }) {
  const [newTaskContent, setNewTaskContent] = useState('');

  const handleAddTask = () => {
    if (newTaskContent.trim()) {
      onAddTask(columnId, newTaskContent.trim());
      setNewTaskContent('');
    }
  };

  return (
    <Card className="w-full md:w-80 flex-shrink-0 bg-background/50 h-full flex flex-col">
      <CardHeader className="p-3 border-b">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <CardContent
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`p-3 flex-grow overflow-y-auto transition-colors ${snapshot.isDraggingOver ? 'bg-primary/10' : ''}`}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} onDelete={onDeleteTask} />
            ))}
            {provided.placeholder}
            <div className="mt-2">
              <Textarea
                value={newTaskContent}
                onChange={(e) => setNewTaskContent(e.target.value)}
                placeholder="إضافة مهمة جديدة..."
                className="mb-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddTask();
                  }
                }}
              />
              <Button onClick={handleAddTask} size="sm" className="w-full">
                <Plus className="ml-2 h-4 w-4" /> إضافة مهمة
              </Button>
            </div>
          </CardContent>
        )}
      </Droppable>
    </Card>
  );
}


export default function ProjectsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const tasksCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/projectTasks`);
  }, [firestore, user]);

  const { data: tasks, isLoading } = useCollection<ProjectTask>(tasksCollectionRef);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (!firestore || !user) return;
    const taskDocRef = doc(firestore, `users/${user.uid}/projectTasks`, draggableId);
    
    updateDoc(taskDocRef, { columnId: destination.droppableId });
    
    toast({
        title: "تم نقل المهمة",
        description: `تم نقل المهمة إلى "${columns[destination.droppableId as ColumnId]}".`
    });
  };
  
  const handleAddTask = async (columnId: ColumnId, content: string) => {
     if (!tasksCollectionRef || !user) return;
     try {
        await addDoc(tasksCollectionRef, {
            content,
            columnId,
            userId: user.uid,
            createdAt: serverTimestamp(),
        });
        toast({ title: "تمت إضافة المهمة بنجاح" });
     } catch (e) {
        console.error("Error adding task:", e);
        toast({ variant: 'destructive', title: "خطأ", description: "فشل إضافة المهمة."});
     }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!firestore || !user) return;
    const taskDocRef = doc(firestore, `users/${user.uid}/projectTasks`, taskId);
    try {
        await deleteDoc(taskDocRef);
        toast({ title: "تم حذف المهمة" });
    } catch(e) {
        console.error("Error deleting task:", e);
        toast({ variant: 'destructive', title: "خطأ", description: "فشل حذف المهمة."});
    }
  }

  const tasksByColumn = useMemo(() => {
    const initial: Record<ColumnId, ProjectTask[]> = {
      todo: [],
      'in-progress': [],
      'done': [],
    };
    if (!tasks) return initial;
    
    const sortedTasks = [...tasks].sort((a,b) => (a.createdAt as any) - (b.createdAt as any));

    return sortedTasks.reduce((acc, task) => {
      const column = task.columnId || 'todo';
      if(acc[column]) {
        acc[column].push(task);
      }
      return acc;
    }, initial);
  }, [tasks]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 h-[calc(100vh_-_4rem)] flex flex-col">
       <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">إدارة المشاريع (Kanban)</h2>
      </div>
      {isLoading ? (
        <div className="flex-grow flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
                {Object.entries(columns).map(([id, title]) => (
                    <Column
                        key={id}
                        columnId={id as ColumnId}
                        title={title}
                        tasks={tasksByColumn[id as ColumnId]}
                        onAddTask={handleAddTask}
                        onDeleteTask={handleDeleteTask}
                    />
                ))}
            </div>
        </DragDropContext>
      )}
    </div>
  );
}
