export class ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };

  static success<T>(data: T, message?: string): ApiResponse<T> {
    const response = new ApiResponse<T>();
    response.success = true;
    response.data = data;
    response.message = message;
    return response;
  }

  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): ApiResponse<T[]> {
    const response = new ApiResponse<T[]>();
    response.success = true;
    response.data = data;
    response.meta = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
    return response;
  }

  static error(message: string, statusCode?: number): ApiResponse<null> {
    const response = new ApiResponse<null>();
    response.success = false;
    response.message = message;
    return response;
  }
}
