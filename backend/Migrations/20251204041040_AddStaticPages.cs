using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZooPortal.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStaticPages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "StaticPages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    MetaDescription = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsPublished = table.Column<bool>(type: "boolean", nullable: false),
                    LastEditedById = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaticPages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StaticPages_Users_LastEditedById",
                        column: x => x.LastEditedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StaticPages_LastEditedById",
                table: "StaticPages",
                column: "LastEditedById");

            migrationBuilder.CreateIndex(
                name: "IX_StaticPages_Slug",
                table: "StaticPages",
                column: "Slug",
                unique: true);

            // Seed initial static pages
            migrationBuilder.InsertData(
                table: "StaticPages",
                columns: new[] { "Id", "Slug", "Title", "Content", "MetaDescription", "IsPublished", "CreatedAt" },
                values: new object[,]
                {
                    {
                        Guid.NewGuid(),
                        "about",
                        "О проекте",
                        @"# О проекте DomZverei

DomZverei - это портал помощи животным, созданный для объединения людей, приютов и животных, нуждающихся в доме.

## Наша миссия
Помочь каждому животному найти любящий дом и поддержать приюты в их важной работе.",
                        "Портал помощи животным DomZverei",
                        true,
                        DateTime.UtcNow
                    },
                    {
                        Guid.NewGuid(),
                        "contacts",
                        "Контакты",
                        @"# Контакты

Свяжитесь с нами:

**Email:** info@domzverei.ru",
                        "Контактная информация DomZverei",
                        true,
                        DateTime.UtcNow
                    }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "StaticPages",
                keyColumn: "Slug",
                keyValues: new object[] { "about", "contacts" });

            migrationBuilder.DropTable(
                name: "StaticPages");
        }
    }
}
