using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZooPortal.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateLostFoundWithModerationAndCity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "City",
                table: "LostFoundPosts");

            migrationBuilder.AddColumn<Guid>(
                name: "CityId",
                table: "LostFoundPosts",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "DistinctiveFeatures",
                table: "LostFoundPosts",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModeratedAt",
                table: "LostFoundPosts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ModeratedById",
                table: "LostFoundPosts",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ModerationComment",
                table: "LostFoundPosts",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ModerationStatus",
                table: "LostFoundPosts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_LostFoundPosts_CityId",
                table: "LostFoundPosts",
                column: "CityId");

            migrationBuilder.CreateIndex(
                name: "IX_LostFoundPosts_ModeratedById",
                table: "LostFoundPosts",
                column: "ModeratedById");

            migrationBuilder.AddForeignKey(
                name: "FK_LostFoundPosts_Cities_CityId",
                table: "LostFoundPosts",
                column: "CityId",
                principalTable: "Cities",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_LostFoundPosts_Users_ModeratedById",
                table: "LostFoundPosts",
                column: "ModeratedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LostFoundPosts_Cities_CityId",
                table: "LostFoundPosts");

            migrationBuilder.DropForeignKey(
                name: "FK_LostFoundPosts_Users_ModeratedById",
                table: "LostFoundPosts");

            migrationBuilder.DropIndex(
                name: "IX_LostFoundPosts_CityId",
                table: "LostFoundPosts");

            migrationBuilder.DropIndex(
                name: "IX_LostFoundPosts_ModeratedById",
                table: "LostFoundPosts");

            migrationBuilder.DropColumn(
                name: "CityId",
                table: "LostFoundPosts");

            migrationBuilder.DropColumn(
                name: "DistinctiveFeatures",
                table: "LostFoundPosts");

            migrationBuilder.DropColumn(
                name: "ModeratedAt",
                table: "LostFoundPosts");

            migrationBuilder.DropColumn(
                name: "ModeratedById",
                table: "LostFoundPosts");

            migrationBuilder.DropColumn(
                name: "ModerationComment",
                table: "LostFoundPosts");

            migrationBuilder.DropColumn(
                name: "ModerationStatus",
                table: "LostFoundPosts");

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "LostFoundPosts",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");
        }
    }
}
