using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MusigElgg.Domain.Dtos;
using MusigElgg.Infrastructure.Services;

namespace MusigElgg.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EventsController : ControllerBase
    {
        private readonly IEventService _eventService;

        public EventsController(IEventService eventService)
        {
            _eventService = eventService;
        }

        [HttpGet]
        [AllowAnonymous] // Public can see events, but maybe limited details? For now allow all.
        public async Task<ActionResult<IEnumerable<EventDto>>> GetAll([FromQuery] bool futureOnly = true)
        {
            var events = await _eventService.GetAllAsync(futureOnly);
            return Ok(events);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<EventDto>> GetById(int id)
        {
            var evt = await _eventService.GetByIdAsync(id);
            if (evt == null) return NotFound();
            return Ok(evt);
        }

        [HttpPost]
        [Authorize(Roles = "Board,Admin")] // Only Board can create events
        public async Task<ActionResult<EventDto>> Create(CreateEventDto dto)
        {
            var evt = await _eventService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = evt.Id }, evt);
        }

        [HttpPost("{id}/attendance")]
        [Authorize] // Any member can vote
        public async Task<ActionResult> SetAttendance(int id, [FromBody] SetAttendanceDto dto)
        {
            // Get user ID from claims
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();
            
            int userId = int.Parse(userIdClaim.Value);
            
            await _eventService.SetAttendanceAsync(id, userId, dto.Status, dto.Comment);
            return Ok();
        }
        
        [HttpGet("{id}/attendance")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<AttendanceDto>>> GetAttendance(int id)
        {
             var list = await _eventService.GetAttendanceAsync(id);
             return Ok(list);
        }
    }
}
