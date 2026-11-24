'use client';

import { useFormState } from 'react-dom';
import { updateEvent } from '@/app/actions/events';
import { SubmitButton } from '@/components/SubmitButton';
import { DeleteEventButton } from '@/components/DeleteEventButton';
import type { ActionState } from '@/lib/validation';

interface EditEventFormProps {
  event: {
    id: string;
    title: string;
    description: string;
    startsAt: Date;
    capacity: number;
    visibility: string;
    coverImage?: string | null;
    attendeesCount: number;
  };
}

export function EditEventForm({ event }: EditEventFormProps) {
  const updateAction = updateEvent.bind(null, event.id);
  const [state, formAction] = useFormState<ActionState, FormData>(
    updateAction,
    null,
  );

  const formattedDate = new Date(event.startsAt).toISOString().slice(0, 16);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Редагувати подію</h1>
        <DeleteEventButton eventId={event.id} />
      </div>

      {state?.error && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6"
          role="alert"
        >
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Назва події *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={120}
            defaultValue={event.title}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
          {state?.fieldErrors?.title && (
            <p className="text-red-500 text-xs mt-1">
              {state.fieldErrors.title[0]}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Опис події *
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={5}
            maxLength={5000}
            defaultValue={event.description}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
          {state?.fieldErrors?.description && (
            <p className="text-red-500 text-xs mt-1">
              {state.fieldErrors.description[0]}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="startsAt"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Дата та час початку *
            </label>
            <input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              required
              defaultValue={formattedDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
            {state?.fieldErrors?.startsAt && (
              <p className="text-red-500 text-xs mt-1">
                {state.fieldErrors.startsAt[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="capacity"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Кількість місць * (мінімум {event.attendeesCount})
            </label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              required
              min={event.attendeesCount}
              max={10000}
              defaultValue={event.capacity}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              Записано учасників: {event.attendeesCount}. Не можна зменшити нижче цього числа.
            </p>
            {state?.fieldErrors?.capacity && (
              <p className="text-red-500 text-xs mt-1">
                {state.fieldErrors.capacity[0]}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="coverImage"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Змінити обкладинку (JPEG, PNG, WebP до 5 МБ)
          </label>
          <input
            id="coverImage"
            name="coverImage"
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          {event.coverImage && (
            <p className="text-xs text-gray-500 mt-1">
              Поточна обкладинка буде замінена при завантаженні нового файлу.
            </p>
          )}
        </div>

        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2">
            Тип події
          </span>
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="visibility"
                value="PUBLIC"
                defaultChecked={event.visibility === 'PUBLIC'}
                className="mt-1 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="block text-sm font-medium text-gray-900">
                  Публічна
                </span>
                <span className="block text-xs text-gray-500">
                  Відображається на головній сторінці та доступна у пошуку для всіх
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="visibility"
                value="PRIVATE"
                defaultChecked={event.visibility === 'PRIVATE'}
                className="mt-1 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="block text-sm font-medium text-gray-900">
                  Приватна
                </span>
                <span className="block text-xs text-gray-500">
                  Доступна лише за криптографічним посиланням-запрошенням
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex gap-4">
          <SubmitButton
            loadingText="Збереження..."
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-medium text-sm transition-colors shadow-sm"
          >
            Зберегти зміни
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
