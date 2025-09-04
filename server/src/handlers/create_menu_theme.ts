import { type CreateMenuThemeInput, type MenuTheme } from '../schema';

export const createMenuTheme = async (input: CreateMenuThemeInput): Promise<MenuTheme> => {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is creating a new menu theme persisting it in the database.
    // Should deactivate other themes if this one is set as active.
    return Promise.resolve({
        id: 0, // Placeholder ID
        restaurant_name: input.restaurant_name,
        button_color: input.button_color,
        button_shape: input.button_shape,
        background_type: input.background_type,
        background_value: input.background_value,
        border_radius: input.border_radius,
        primary_color: input.primary_color,
        text_color: input.text_color,
        is_active: input.is_active ?? true,
        created_at: new Date(),
        updated_at: new Date()
    } as MenuTheme);
};