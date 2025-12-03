using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZooPortal.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSheltersWithCities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "City",
                table: "Shelters");

            migrationBuilder.RenameColumn(
                name: "ImageUrl",
                table: "Shelters",
                newName: "Needs");

            migrationBuilder.AlterColumn<string>(
                name: "Website",
                table: "Shelters",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "AcceptsVolunteers",
                table: "Shelters",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "CatsCount",
                table: "Shelters",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "CityId",
                table: "Shelters",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<int>(
                name: "DogsCount",
                table: "Shelters",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "DonationCardHolder",
                table: "Shelters",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DonationCardNumber",
                table: "Shelters",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DonationDetails",
                table: "Shelters",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DonationPhone",
                table: "Shelters",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FoundedYear",
                table: "Shelters",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InstagramUrl",
                table: "Shelters",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LogoUrl",
                table: "Shelters",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModeratedAt",
                table: "Shelters",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ModeratedById",
                table: "Shelters",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ModerationComment",
                table: "Shelters",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ModerationStatus",
                table: "Shelters",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "OtherAnimalsCount",
                table: "Shelters",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "OwnerId",
                table: "Shelters",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Phone2",
                table: "Shelters",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ShortDescription",
                table: "Shelters",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TelegramUrl",
                table: "Shelters",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VkUrl",
                table: "Shelters",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VolunteersCount",
                table: "Shelters",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WorkingHours",
                table: "Shelters",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Cities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Region = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cities", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ShelterImages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    FileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    IsMain = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    ShelterId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShelterImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShelterImages_Shelters_ShelterId",
                        column: x => x.ShelterId,
                        principalTable: "Shelters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Shelters_CityId",
                table: "Shelters",
                column: "CityId");

            migrationBuilder.CreateIndex(
                name: "IX_Shelters_ModeratedById",
                table: "Shelters",
                column: "ModeratedById");

            migrationBuilder.CreateIndex(
                name: "IX_Shelters_OwnerId",
                table: "Shelters",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_ShelterImages_ShelterId",
                table: "ShelterImages",
                column: "ShelterId");

            migrationBuilder.AddForeignKey(
                name: "FK_Shelters_Cities_CityId",
                table: "Shelters",
                column: "CityId",
                principalTable: "Cities",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Shelters_Users_ModeratedById",
                table: "Shelters",
                column: "ModeratedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Shelters_Users_OwnerId",
                table: "Shelters",
                column: "OwnerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Shelters_Cities_CityId",
                table: "Shelters");

            migrationBuilder.DropForeignKey(
                name: "FK_Shelters_Users_ModeratedById",
                table: "Shelters");

            migrationBuilder.DropForeignKey(
                name: "FK_Shelters_Users_OwnerId",
                table: "Shelters");

            migrationBuilder.DropTable(
                name: "Cities");

            migrationBuilder.DropTable(
                name: "ShelterImages");

            migrationBuilder.DropIndex(
                name: "IX_Shelters_CityId",
                table: "Shelters");

            migrationBuilder.DropIndex(
                name: "IX_Shelters_ModeratedById",
                table: "Shelters");

            migrationBuilder.DropIndex(
                name: "IX_Shelters_OwnerId",
                table: "Shelters");

            migrationBuilder.DropColumn(
                name: "AcceptsVolunteers",
                table: "Shelters");

            migrationBuilder.DropColumn(
                name: "CatsCount",
                table: "Shelters");

            migrationBuilder.DropColumn(
                name: "CityId",
                table: "Shelters");

            migrationBuilder.DropColumn(
                name: "DogsCount",
                table: "Shelters");

            migrationBuilder.DropColumn(
                name: "DonationCardHolder",
                table: "Shelters");

            migrationBuilder.DropColumn(
                name: "DonationCardNumber",
                table: "Shelters");

            migrationBuilder.DropColumn(
                name: "DonationDetails",
                table: "Shelters");

            migrationBuilder.DropColumn(
                name: "DonationPhone",
                table: "Shelters");

            migrationBuilder.DropColumn(
                name: "FoundedYear",
                table: "Shelters");

            migrationBuilder.DropColumn(
                name: "InstagramUrl",
                table: "Shelters");

            migrationBuilder.DropColumn(
                name: "LogoUrl",
                table: "Shelters");

            migrationBuilder.DropColumn(
                name: "ModeratedAt",
                table: "Shelters");

            migrationBuilder.DropColumn(
                name: "ModeratedById",
                table: "Shelters");

            migrationBuilder.DropColumn(
                name: "ModerationComment",
                table: "Shelters");

            migrationBuilder.DropColumn(
                name: "ModerationStatus",
                table: "Shelters");

            migrationBuilder.DropColumn(
                name: "OtherAnimalsCount",
                table: "Shelters");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "Shelters");

            migrationBuilder.DropColumn(
                name: "Phone2",
                table: "Shelters");

            migrationBuilder.DropColumn(
                name: "ShortDescription",
                table: "Shelters");

            migrationBuilder.DropColumn(
                name: "TelegramUrl",
                table: "Shelters");

            migrationBuilder.DropColumn(
                name: "VkUrl",
                table: "Shelters");

            migrationBuilder.DropColumn(
                name: "VolunteersCount",
                table: "Shelters");

            migrationBuilder.DropColumn(
                name: "WorkingHours",
                table: "Shelters");

            migrationBuilder.RenameColumn(
                name: "Needs",
                table: "Shelters",
                newName: "ImageUrl");

            migrationBuilder.AlterColumn<string>(
                name: "Website",
                table: "Shelters",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "Shelters",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");
        }
    }
}
