import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
    const spec = createSwaggerSpec({
        apiFolder: 'app/api/v1', // Only document the public v1 APIs
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'Kapra HRMS Developer API',
                version: '1.0.0',
                description: 'Public API documentation for integrating external services with Kapra HRMS.',
            },
            components: {
                securitySchemes: {
                    BearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'API_KEY',
                        description: 'Enter your API key (starting with sk_...) in the format: Bearer <token>'
                    },
                },
                schemas: {
                    Employee: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            employeeId: { type: 'string' },
                            firstName: { type: 'string' },
                            lastName: { type: 'string' },
                            jobTitle: { type: 'string' },
                            hireDate: { type: 'string', format: 'date-time' },
                            employmentType: { type: 'string' },
                        }
                    }
                }
            },
            security: [],
        },
    });
    return spec;
};
