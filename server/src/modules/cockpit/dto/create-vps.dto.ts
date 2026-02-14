import { IsString, IsInt, IsNotEmpty, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVpsDto {
    @ApiProperty({ example: 'My Production VPS' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: '192.168.1.100' })
    @IsString()
    @IsNotEmpty()
    host: string;

    @ApiProperty({ example: 22, default: 22 })
    @IsInt()
    @Min(1)
    @Max(65535)
    port: number;

    @ApiProperty({ example: 'root' })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({ example: 'password123' })
    @IsString()
    @IsNotEmpty()
    password: string;
}
