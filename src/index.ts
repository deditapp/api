/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface DocumentDto {
	id: string;
	title: string;
	tags: string[];
	createdAt: string;
	updatedAt: string;
	ownerId: string;
}

export interface UpdateDocumentPayloadDto {
	title?: string;
	tags?: string[];
	createdAt?: string;
	updatedAt?: string;
	ownerId?: string;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
	/** set parameter to `true` for call `securityWorker` for this request */
	secure?: boolean;
	/** request path */
	path: string;
	/** content type of request body */
	type?: ContentType;
	/** query params */
	query?: QueryParamsType;
	/** format of response (i.e. response.json() -> format: "json") */
	format?: ResponseFormat;
	/** request body */
	body?: unknown;
	/** base url */
	baseUrl?: string;
	/** request cancellation token */
	cancelToken?: CancelToken;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown> {
	baseUrl?: string;
	baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
	securityWorker?: (
		securityData: SecurityDataType | null
	) => Promise<RequestParams | void> | RequestParams | void;
	customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown> extends Response {
	data: D;
	error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
	Json = "application/json",
	FormData = "multipart/form-data",
	UrlEncoded = "application/x-www-form-urlencoded",
}

export class HttpClient<SecurityDataType = unknown> {
	public baseUrl: string = "";
	private securityData: SecurityDataType | null = null;
	private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
	private abortControllers = new Map<CancelToken, AbortController>();
	private customFetch = (...fetchParams: Parameters<typeof fetch>) => fetch(...fetchParams);

	private baseApiParams: RequestParams = {
		credentials: "same-origin",
		headers: {},
		redirect: "follow",
		referrerPolicy: "no-referrer",
	};

	constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
		Object.assign(this, apiConfig);
	}

	public setSecurityData = (data: SecurityDataType | null) => {
		this.securityData = data;
	};

	private encodeQueryParam(key: string, value: any) {
		const encodedKey = encodeURIComponent(key);
		return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
	}

	private addQueryParam(query: QueryParamsType, key: string) {
		return this.encodeQueryParam(key, query[key]);
	}

	private addArrayQueryParam(query: QueryParamsType, key: string) {
		const value = query[key];
		return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
	}

	protected toQueryString(rawQuery?: QueryParamsType): string {
		const query = rawQuery || {};
		const keys = Object.keys(query).filter((key) => "undefined" !== typeof query[key]);
		return keys
			.map((key) =>
				Array.isArray(query[key])
					? this.addArrayQueryParam(query, key)
					: this.addQueryParam(query, key)
			)
			.join("&");
	}

	protected addQueryParams(rawQuery?: QueryParamsType): string {
		const queryString = this.toQueryString(rawQuery);
		return queryString ? `?${queryString}` : "";
	}

	private contentFormatters: Record<ContentType, (input: any) => any> = {
		[ContentType.Json]: (input: any) =>
			input !== null && (typeof input === "object" || typeof input === "string")
				? JSON.stringify(input)
				: input,
		[ContentType.FormData]: (input: any) =>
			Object.keys(input || {}).reduce((formData, key) => {
				const property = input[key];
				formData.append(
					key,
					property instanceof Blob
						? property
						: typeof property === "object" && property !== null
						? JSON.stringify(property)
						: `${property}`
				);
				return formData;
			}, new FormData()),
		[ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
	};

	private mergeRequestParams(params1: RequestParams, params2?: RequestParams): RequestParams {
		return {
			...this.baseApiParams,
			...params1,
			...(params2 || {}),
			headers: {
				...(this.baseApiParams.headers || {}),
				...(params1.headers || {}),
				...((params2 && params2.headers) || {}),
			},
		};
	}

	private createAbortSignal = (cancelToken: CancelToken): AbortSignal | undefined => {
		if (this.abortControllers.has(cancelToken)) {
			const abortController = this.abortControllers.get(cancelToken);
			if (abortController) {
				return abortController.signal;
			}
			return void 0;
		}

		const abortController = new AbortController();
		this.abortControllers.set(cancelToken, abortController);
		return abortController.signal;
	};

	public abortRequest = (cancelToken: CancelToken) => {
		const abortController = this.abortControllers.get(cancelToken);

		if (abortController) {
			abortController.abort();
			this.abortControllers.delete(cancelToken);
		}
	};

	public request = async <T = any, E = any>({
		body,
		secure,
		path,
		type,
		query,
		format,
		baseUrl,
		cancelToken,
		...params
	}: FullRequestParams): Promise<HttpResponse<T, E>> => {
		const secureParams =
			((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
				this.securityWorker &&
				(await this.securityWorker(this.securityData))) ||
			{};
		const requestParams = this.mergeRequestParams(params, secureParams);
		const queryString = query && this.toQueryString(query);
		const payloadFormatter = this.contentFormatters[type || ContentType.Json];
		const responseFormat = format || requestParams.format;

		return this.customFetch(
			`${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
			{
				...requestParams,
				headers: {
					...(type && type !== ContentType.FormData ? { "Content-Type": type } : {}),
					...(requestParams.headers || {}),
				},
				signal: cancelToken ? this.createAbortSignal(cancelToken) : void 0,
				body: typeof body === "undefined" || body === null ? null : payloadFormatter(body),
			}
		).then(async (response) => {
			const r = response as HttpResponse<T, E>;
			r.data = null as unknown as T;
			r.error = null as unknown as E;

			const data = !responseFormat
				? r
				: await response[responseFormat]()
						.then((data) => {
							if (r.ok) {
								r.data = data;
							} else {
								r.error = data;
							}
							return r;
						})
						.catch((e) => {
							r.error = e;
							return r;
						});

			if (cancelToken) {
				this.abortControllers.delete(cancelToken);
			}

			if (!response.ok) throw data;
			return data;
		});
	};
}

/**
 * @title Dedit API
 * @version 1
 * @contact
 *
 * The API for interfacing with Dedit services.
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
	v1 = {
		/**
		 * No description
		 *
		 * @name DocumentsControllerV1FindMany
		 * @request GET:/v1/documents
		 */
		documentsControllerV1FindMany: (params: RequestParams = {}) =>
			this.request<any, DocumentDto[]>({
				path: `/v1/documents`,
				method: "GET",
				...params,
			}),

		/**
		 * No description
		 *
		 * @name DocumentsControllerV1Create
		 * @request POST:/v1/documents
		 */
		documentsControllerV1Create: (params: RequestParams = {}) =>
			this.request<string, any>({
				path: `/v1/documents`,
				method: "POST",
				format: "json",
				...params,
			}),

		/**
		 * No description
		 *
		 * @name DocumentsControllerV1FindOne
		 * @request GET:/v1/documents/{documentId}
		 */
		documentsControllerV1FindOne: (documentId: string, params: RequestParams = {}) =>
			this.request<any, DocumentDto>({
				path: `/v1/documents/${documentId}`,
				method: "GET",
				...params,
			}),

		/**
		 * No description
		 *
		 * @name DocumentsControllerV1Update
		 * @request PATCH:/v1/documents/{documentId}
		 */
		documentsControllerV1Update: (
			documentId: string,
			data: UpdateDocumentPayloadDto,
			params: RequestParams = {}
		) =>
			this.request<string, any>({
				path: `/v1/documents/${documentId}`,
				method: "PATCH",
				body: data,
				type: ContentType.Json,
				format: "json",
				...params,
			}),

		/**
		 * No description
		 *
		 * @name UsersControllerV1Me
		 * @request GET:/v1/me
		 */
		usersControllerV1Me: (params: RequestParams = {}) =>
			this.request<void, any>({
				path: `/v1/me`,
				method: "GET",
				...params,
			}),

		/**
		 * No description
		 *
		 * @name UsersControllerV1Login
		 * @request POST:/v1/login
		 */
		usersControllerV1Login: (params: RequestParams = {}) =>
			this.request<void, any>({
				path: `/v1/login`,
				method: "POST",
				...params,
			}),

		/**
		 * No description
		 *
		 * @name UsersControllerV1FinalizeLogin
		 * @request POST:/v1/login/redirect
		 */
		usersControllerV1FinalizeLogin: (params: RequestParams = {}) =>
			this.request<void, any>({
				path: `/v1/login/redirect`,
				method: "POST",
				...params,
			}),
	};
}
